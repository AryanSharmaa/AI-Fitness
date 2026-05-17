import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDailyCalorieTarget } from '@/lib/engines/nutrition'
import OpenAI from 'openai'

const MODELS = [
  'deepseek/deepseek-v4-flash:free',
  'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
]

let _client: OpenAI | null = null
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY || '',
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
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      })
      return res.choices[0]?.message?.content ?? ''
    } catch (err: unknown) {
      const status = (err as { status?: number; response?: { status?: number } })?.status
        ?? (err as { response?: { status?: number } })?.response?.status
      if (status === 429 || status === 404 || status === 503) {
        lastError = err
        continue
      }
      throw err
    }
  }
  throw lastError
}

export interface MealSuggestion {
  meal: string
  suggestion: string
  calories: number
  protein: number
  carbs: number
  fat: number
  reason: string
}

export interface MealPlanResponse {
  consumed: { calories: number; protein: number; carbs: number; fat: number }
  remaining: { calories: number; protein: number; carbs: number; fat: number }
  goals: { calories: number; protein: number; carbs: number; fat: number }
  suggestions: MealSuggestion[]
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const { searchParams } = new URL(req.url)
  const forceRegenerate = searchParams.get('regenerate') === '1'

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [profile, todayFoodLogs, todayWorkout] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.foodLog.findMany({
      where: { userId, date: { gte: todayStart } },
    }),
    prisma.workoutLog.findFirst({
      where: { userId, date: { gte: todayStart }, completed: true },
      orderBy: { date: 'desc' },
    }),
  ])

  // Compute consumed macros
  const consumed = todayFoodLogs.reduce(
    (acc, l) => ({
      calories: acc.calories + (l.calories ?? 0),
      protein: acc.protein + (l.protein ?? 0),
      carbs: acc.carbs + (l.carbs ?? 0),
      fat: acc.fat + (l.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // Calorie goal
  const calorieGoal = getDailyCalorieTarget({
    age: profile?.age ?? undefined,
    weight: profile?.weight ?? undefined,
    height: profile?.height ?? undefined,
    gender: profile?.gender ?? undefined,
    goal: profile?.goal ?? undefined,
    workSchedule: profile?.workSchedule ?? undefined,
  })

  // Macro goals (derive from profile if set, else estimate)
  const proteinGoal = profile?.proteinGoal ?? Math.round((calorieGoal * 0.3) / 4)
  const carbsGoal = profile?.carbsGoal ?? Math.round((calorieGoal * 0.45) / 4)
  const fatGoal = profile?.fatGoal ?? Math.round((calorieGoal * 0.25) / 9)

  const caloriesBurned = todayWorkout?.caloriesBurned ?? 0

  // Remaining = goal + burned - consumed
  const remaining = {
    calories: Math.max(0, calorieGoal + caloriesBurned - Math.round(consumed.calories)),
    protein: Math.max(0, proteinGoal - Math.round(consumed.protein)),
    carbs: Math.max(0, carbsGoal - Math.round(consumed.carbs)),
    fat: Math.max(0, fatGoal - Math.round(consumed.fat)),
  }

  const goals = { calories: calorieGoal, protein: proteinGoal, carbs: carbsGoal, fat: fatGoal }

  // Check cache
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
  const cached = await prisma.plan.findFirst({
    where: { userId, type: 'daily_meal', active: true },
    orderBy: { createdAt: 'desc' },
  })

  if (cached && !forceRegenerate && cached.createdAt > twoHoursAgo) {
    const content = cached.content as unknown as { suggestions: MealSuggestion[] }
    return NextResponse.json({
      consumed: {
        calories: Math.round(consumed.calories),
        protein: Math.round(consumed.protein),
        carbs: Math.round(consumed.carbs),
        fat: Math.round(consumed.fat),
      },
      remaining,
      goals,
      suggestions: content.suggestions ?? [],
    } satisfies MealPlanResponse)
  }

  // Generate AI suggestions
  const preference = profile?.foodPreference ?? 'vegetarian'
  const prompt = `You are a nutrition coach. Given the user's remaining macros for today, suggest 2-3 specific Indian meals they can eat.
User has consumed ${Math.round(consumed.calories)}cal, has ${remaining.calories}cal remaining, needs ${remaining.protein}g protein / ${remaining.carbs}g carbs / ${remaining.fat}g fat more. Food preference: ${preference}.
Return ONLY a valid JSON array (no markdown, no explanation):
[{ "meal": "Dinner", "suggestion": "specific dish name", "calories": N, "protein": N, "carbs": N, "fat": N, "reason": "why this fits" }]
Use realistic Indian meal names. The meal field should be one of: Breakfast, Lunch, Dinner, Snack.`

  let suggestions: MealSuggestion[] = []
  try {
    const raw = await callAI(prompt)
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      suggestions = JSON.parse(jsonMatch[0]) as MealSuggestion[]
    }
  } catch {
    // Use fallback suggestions
    suggestions = [
      {
        meal: 'Dinner',
        suggestion: 'Dal tadka with 2 rotis',
        calories: Math.min(remaining.calories, 400),
        protein: 18,
        carbs: 55,
        fat: 8,
        reason: 'High protein, balanced meal to meet your remaining macros.',
      },
    ]
  }

  // Deactivate old daily meal plans and save new one
  await prisma.plan.updateMany({
    where: { userId, type: 'daily_meal', active: true },
    data: { active: false },
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const planContent: any = { suggestions }
  await prisma.plan.create({
    data: { userId, type: 'daily_meal', content: planContent, active: true },
  })

  return NextResponse.json({
    consumed: {
      calories: Math.round(consumed.calories),
      protein: Math.round(consumed.protein),
      carbs: Math.round(consumed.carbs),
      fat: Math.round(consumed.fat),
    },
    remaining,
    goals,
    suggestions,
  } satisfies MealPlanResponse)
}
