import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { estimateMealNutrition, getDailyCalorieTarget, getNextMealAdjustment } from '@/lib/engines/nutrition'
import Groq from 'groq-sdk'

let _groq: Groq | null = null
function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })
  return _groq
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const { description, mealType, inputMethod = 'text' } = await req.json()
  if (!description || !mealType) {
    return NextResponse.json({ error: 'description and mealType required' }, { status: 400 })
  }

  const [profile, todayLogs] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.foodLog.findMany({
      where: {
        userId,
        date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ])

  // Estimate nutrition
  const nutrition = estimateMealNutrition(description)

  // Get AI analysis
  let aiAnalysis = ''
  try {
    const dailyTarget = getDailyCalorieTarget({
      age: profile?.age || undefined,
      weight: profile?.weight || undefined,
      height: profile?.height || undefined,
      gender: profile?.gender || undefined,
      goal: profile?.goal || undefined,
      workSchedule: profile?.workSchedule || undefined,
    })

    const todayTotal = todayLogs.reduce((s, l) => s + (l.calories || 0), 0) + nutrition.estimatedCalories
    const adjustment = getNextMealAdjustment(
      [...todayLogs.map(l => ({ calories: l.calories ?? undefined, mealType: l.mealType })), { calories: nutrition.estimatedCalories, mealType }],
      dailyTarget
    )

    const result = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 256,
      messages: [
        { role: 'system', content: 'You are a non-judgmental Indian fitness nutrition coach. Be brief, warm, and practical.' },
        { role: 'user', content: `User logged: "${description}" for ${mealType}. Estimated: ~${nutrition.estimatedCalories} cal, ${nutrition.estimatedProtein}g protein. Today's total so far: ~${todayTotal} cal out of ${dailyTarget} target. Give a 1-2 sentence non-judgmental feedback and the adjustment note: "${adjustment}"` },
      ],
    })
    aiAnalysis = result.choices[0]?.message?.content ?? ''
  } catch {}

  const log = await prisma.foodLog.create({
    data: {
      userId,
      meal: description.slice(0, 100),
      description,
      mealType,
      inputMethod,
      calories: nutrition.estimatedCalories,
      protein: nutrition.estimatedProtein,
      carbs: nutrition.estimatedCarbs,
      fat: nutrition.estimatedFat,
      aiAnalysis,
    },
  })

  return NextResponse.json({ log, nutrition, aiAnalysis })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const startOfDay = new Date(date + 'T00:00:00.000Z')
  const endOfDay = new Date(date + 'T23:59:59.999Z')

  const logs = await prisma.foodLog.findMany({
    where: { userId: session.user.id, date: { gte: startOfDay, lte: endOfDay } },
    orderBy: { date: 'asc' },
  })

  const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } })
  const dailyTarget = getDailyCalorieTarget({
    age: profile?.age || undefined,
    weight: profile?.weight || undefined,
    height: profile?.height || undefined,
    gender: profile?.gender || undefined,
    goal: profile?.goal || undefined,
  })

  const totals = logs.reduce((acc, l) => ({
    calories: acc.calories + (l.calories || 0),
    protein: acc.protein + (l.protein || 0),
    carbs: acc.carbs + (l.carbs || 0),
    fat: acc.fat + (l.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  return NextResponse.json({ logs, totals, dailyTarget })
}
