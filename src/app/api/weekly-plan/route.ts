import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getAnySession } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { getUserPlan } from '@/lib/plan'
import { buildPrompt, WEEKLY_PLAN_PROMPT } from '@/lib/prompts'
import OpenAI from 'openai'

const MODELS = [
  'deepseek/deepseek-chat-v3-0324:free',
  'google/gemma-3-27b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'openai/gpt-oss-20b:free',
  'openrouter/free',
]

function getClient() {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
  })
}

async function callAI(prompt: string): Promise<string> {
  let lastError: any
  for (const model of MODELS) {
    try {
      const res = await getClient().chat.completions.create({
        model,
        max_tokens: 1800,
        stream: false,
        messages: [{ role: 'user', content: prompt }],
      })
      return res.choices[0]?.message?.content ?? ''
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status
      if (status === 429 || status === 404 || status === 503) { lastError = err; continue }
      throw err
    }
  }
  throw lastError
}

const FREE_PLAN = {
  generatedAt: new Date().toISOString(),
  days: [
    { day: 'Monday',    workout: '30-min full body strength (bodyweight)',        meals: { breakfast: 'Oats with banana', lunch: 'Dal chawal + salad', dinner: 'Sabzi + 2 roti', snack: 'Fruits' } },
    { day: 'Tuesday',   workout: 'Rest / 20-min walk',                            meals: { breakfast: 'Poha or upma', lunch: 'Rajma rice', dinner: 'Paneer sabzi + roti', snack: 'Curd' } },
    { day: 'Wednesday', workout: '30-min cardio (run / cycle / jump rope)',        meals: { breakfast: 'Eggs or besan chilla', lunch: 'Chole + rice', dinner: 'Moong dal + roti', snack: 'Nuts' } },
    { day: 'Thursday',  workout: '30-min upper body (push/pull)',                  meals: { breakfast: 'Idli + sambar', lunch: 'Mixed veg rice', dinner: 'Dal + 2 roti', snack: 'Sprouts' } },
    { day: 'Friday',    workout: 'Rest / stretching / yoga',                       meals: { breakfast: 'Paratha + curd', lunch: 'Palak paneer + rice', dinner: 'Light soup + roti', snack: 'Banana' } },
    { day: 'Saturday',  workout: '45-min HIIT or sport activity',                  meals: { breakfast: 'Protein smoothie or milk + banana', lunch: 'Chicken / soya curry + rice', dinner: 'Sabzi + dal + roti', snack: 'Peanuts' } },
    { day: 'Sunday',    workout: 'Active rest — long walk / family activity',      meals: { breakfast: 'Dosa + chutney', lunch: 'Your choice (mindful)', dinner: 'Light khichdi', snack: 'Seasonal fruit' } },
  ],
  note: 'This is a general plan. Upgrade to Pro for a personalized plan based on your actual data.',
}

export async function GET(req: NextRequest) {
  const anySession = await getAnySession(req)
  if (!anySession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = anySession.userId
  const plan = await getUserPlan(userId, anySession.email)

  if (plan === 'free') {
    return NextResponse.json({ plan: 'free', weeklyPlan: FREE_PLAN })
  }

  // Check cache — regenerate only if > 6 hours old or forced
  const url = new URL(req.url)
  const force = url.searchParams.get('regenerate') === '1'

  const cached = await prisma.plan.findFirst({
    where: { userId, type: 'weekly', active: true },
    orderBy: { createdAt: 'desc' },
  })

  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)
  if (cached && !force && cached.createdAt > sixHoursAgo) {
    return NextResponse.json({ plan: 'pro', weeklyPlan: cached.content })
  }

  // Gather user context
  const [profile, recentWorkouts, recentFood, streaks] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.workoutLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 14,
      select: { type: true, duration: true, completed: true, skipped: true, date: true },
    }),
    prisma.foodLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 21,
      select: { mealType: true, calories: true, protein: true, description: true, date: true },
    }),
    prisma.streak.findMany({ where: { userId } }),
  ])

  const workoutStreak = streaks.find(s => s.type === 'workout')?.currentDays ?? 0
  const avgCalories = recentFood.length
    ? Math.round(recentFood.reduce((s, f) => s + (f.calories ?? 0), 0) / Math.max(recentFood.length, 1))
    : 0
  const completionRate = recentWorkouts.length
    ? Math.round(recentWorkouts.filter(w => w.completed).length / recentWorkouts.length * 100)
    : 0

  const prompt = buildPrompt(WEEKLY_PLAN_PROMPT, {
    goal: profile?.goal ?? 'general fitness',
    age: profile?.age ?? 'unknown',
    gender: profile?.gender ?? 'unknown',
    height: profile?.height ?? '?',
    weight: profile?.weight ?? '?',
    equipment: profile?.equipmentAccess ?? 'none/home',
    foodPreference: profile?.foodPreference ?? 'vegetarian',
    sleepHours: profile?.sleepHours ?? 7,
    workSchedule: profile?.workSchedule ?? 'standard',
    medicalNotes: profile?.medicalNotes ?? 'none',
    disciplineScore: profile?.disciplineScore ?? 50,
    completionRate,
    workoutStreak,
    avgCalories,
    recentWorkoutTypes: [...new Set(recentWorkouts.map(w => w.type))].join(', ') || 'none logged',
    generatedAt: new Date().toISOString(),
  })

  try {
    const raw = await callAI(prompt)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const weeklyPlan = JSON.parse(jsonMatch[0])

    // Deactivate old plans, save new one
    await prisma.plan.updateMany({ where: { userId, type: 'weekly', active: true }, data: { active: false } })
    await prisma.plan.create({ data: { userId, type: 'weekly', content: weeklyPlan, active: true } })

    return NextResponse.json({ plan: 'pro', weeklyPlan })
  } catch {
    // Fall back to cached if AI fails
    if (cached) return NextResponse.json({ plan: 'pro', weeklyPlan: cached.content })
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}
