import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildPrompt, INSIGHTS_PROMPT } from '@/lib/prompts'
import OpenAI from 'openai'

const MODELS = [
  'deepseek/deepseek-chat-v3-0324:free',
  'google/gemma-3-27b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
]

const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

interface Insight {
  type: 'nutrition' | 'workout' | 'recovery' | 'mindset'
  icon: string
  title: string
  body: string
}

const STATIC_INSIGHTS: Insight[] = [
  {
    type: 'nutrition',
    icon: '🥗',
    title: 'Fuel with protein',
    body: 'Aim for 20–30 g of protein at each meal to support muscle repair and keep you feeling full longer.',
  },
  {
    type: 'workout',
    icon: '🏋️',
    title: 'Consistency beats intensity',
    body: 'Three moderate workouts a week will outpace one extreme session. Keep showing up.',
  },
  {
    type: 'recovery',
    icon: '😴',
    title: 'Prioritise your sleep',
    body: '7–9 hours of sleep each night is when your body actually rebuilds muscle and resets hormones.',
  },
]

let _client: OpenAI | null = null
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY ?? '',
    })
  }
  return _client
}

async function callAI(prompt: string): Promise<string> {
  let lastError: unknown
  for (const model of MODELS) {
    try {
      const res = await getClient().chat.completions.create({
        model,
        max_tokens: 512,
        messages: [
          {
            role: 'system',
            content:
              'You are a concise, encouraging fitness coach. Respond ONLY with a valid JSON array — no markdown fences, no extra text.',
          },
          { role: 'user', content: prompt },
        ],
      })
      return res.choices[0]?.message?.content ?? ''
    } catch (err: unknown) {
      const status =
        (err as { status?: number })?.status ??
        (err as { response?: { status?: number } })?.response?.status
      if (status === 429 || status === 404 || status === 503) {
        lastError = err
        continue
      }
      throw err
    }
  }
  throw lastError
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  // --- Check cache ---
  const cached = await prisma.plan.findFirst({
    where: { userId, type: 'insights', active: true },
    orderBy: { updatedAt: 'desc' },
  })

  if (cached) {
    const ageMs = Date.now() - cached.updatedAt.getTime()
    if (ageMs < CACHE_TTL_MS) {
      return NextResponse.json({ insights: cached.content, cached: true })
    }
  }

  // --- Gather user data ---
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [foodLogs, workoutLogs, todayMood, streaks] = await Promise.all([
    prisma.foodLog.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      select: { calories: true, protein: true },
    }),
    prisma.workoutLog.findMany({
      where: { userId, date: { gte: sevenDaysAgo }, completed: true },
      select: { type: true, duration: true },
    }),
    prisma.moodLog.findFirst({
      where: { userId, date: { gte: todayStart } },
      orderBy: { date: 'desc' },
      select: { mood: true, energy: true },
    }),
    prisma.streak.findMany({
      where: { userId },
      select: { type: true, currentDays: true },
    }),
  ])

  // Compute averages
  const avgCalories =
    foodLogs.length > 0
      ? Math.round(foodLogs.reduce((s, l) => s + (l.calories ?? 0), 0) / 7)
      : null
  const avgProtein =
    foodLogs.length > 0
      ? Math.round(foodLogs.reduce((s, l) => s + (l.protein ?? 0), 0) / 7)
      : null
  const workoutCount = workoutLogs.length
  const workoutTypes = [...new Set(workoutLogs.map(w => w.type))]
  const workoutStreak =
    streaks.find(s => s.type === 'workout')?.currentDays ?? 0
  const overallStreak =
    streaks.find(s => s.type === 'overall')?.currentDays ?? 0
  const streak = Math.max(workoutStreak, overallStreak)

  // --- Build prompt ---
  const dataDescription = [
    avgCalories !== null
      ? `Average daily calories (last 7 days): ${avgCalories} kcal`
      : 'No food logs in the last 7 days',
    avgProtein !== null ? `Average daily protein: ${avgProtein} g` : '',
    `Workouts completed in last 7 days: ${workoutCount}${workoutTypes.length ? ` (types: ${workoutTypes.join(', ')})` : ''}`,
    todayMood
      ? `Today's mood: ${todayMood.mood}/5, energy: ${todayMood.energy}/5`
      : 'No mood check-in today',
    streak > 0 ? `Current streak: ${streak} days` : 'No active streak',
  ]
    .filter(Boolean)
    .join('\n')

  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { goal: true, disciplineScore: true, proteinGoal: true },
  })

  const prompt = buildPrompt(INSIGHTS_PROMPT, {
    goal: profile?.goal ?? 'general fitness',
    disciplineScore: profile?.disciplineScore ?? 50,
    avgKcal: avgCalories ?? 0,
    targetKcal: 2000,
    avgProtein: avgProtein ?? 0,
    proteinGoal: profile?.proteinGoal ?? 120,
    weeklyWorkoutsDone: workoutCount,
    weeklyWorkoutsTarget: 4,
    avgMood: todayMood?.mood ?? 3,
    avgEnergy: todayMood?.energy ?? 3,
    streak,
  })

  // --- Call AI ---
  let insights: Insight[] = STATIC_INSIGHTS
  try {
    const raw = await callAI(prompt)
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const parsed: unknown = JSON.parse(cleaned)
    // Handle both array format and {insights:[...]} format
    const arr = Array.isArray(parsed)
      ? parsed
      : (parsed as { insights?: unknown[] })?.insights ?? []
    if (Array.isArray(arr) && arr.length >= 1 && typeof (arr[0] as Record<string, unknown>).type === 'string') {
      insights = (arr as Insight[]).slice(0, 3)
    }
  } catch {
    // Fall back to static insights
  }

  // --- Upsert cache ---
  try {
    if (cached) {
      await prisma.plan.update({
        where: { id: cached.id },
        data: { content: insights as object[], updatedAt: new Date() },
      })
    } else {
      await prisma.plan.create({
        data: { userId, type: 'insights', content: insights as object[], active: true },
      })
    }
  } catch {
    // Non-fatal — still return insights
  }

  return NextResponse.json({ insights, cached: false })
}
