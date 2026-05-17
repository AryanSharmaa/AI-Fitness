import { NextRequest, NextResponse } from 'next/server'
import { getAnySession } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { getBehaviorSummary } from '@/lib/engines/behavior'
import { getDailyCalorieTarget } from '@/lib/engines/nutrition'

export async function GET(req: NextRequest) {
  const anySession = await getAnySession(req)
  if (!anySession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = anySession.userId

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [streaks, weeklyWorkouts, todayFood, user, profile, behaviorLogs] = await Promise.all([
    prisma.streak.findMany({ where: { userId } }),
    prisma.workoutLog.findMany({
      where: { userId, date: { gte: sevenDaysAgo }, completed: true },
    }),
    prisma.foodLog.findMany({
      where: { userId, date: { gte: today } },
      orderBy: { date: 'desc' },
      take: 10,
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.behaviorLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 20,
    }),
  ])

  const workoutStreak = streaks.find(s => s.type === 'workout')?.currentDays || 0
  const nutritionStreak = streaks.find(s => s.type === 'nutrition')?.currentDays || 0

  const todayCalories = todayFood.reduce((s, f) => s + (f.calories || 0), 0)
  const todayProtein = todayFood.reduce((s, f) => s + (f.protein || 0), 0)
  const todayCarbs = todayFood.reduce((s, f) => s + (f.carbs || 0), 0)
  const todayFat = todayFood.reduce((s, f) => s + (f.fat || 0), 0)

  const calorieGoal = getDailyCalorieTarget({
    age: profile?.age || undefined,
    weight: profile?.weight || undefined,
    height: profile?.height || undefined,
    gender: profile?.gender || undefined,
    goal: profile?.goal || undefined,
  })

  const behaviorSummary = getBehaviorSummary(
    behaviorLogs.map(l => ({ event: l.event as any, date: l.date, details: l.details || undefined }))
  )

  return NextResponse.json({
    // Mobile-friendly fields
    calories: { consumed: todayCalories, goal: calorieGoal },
    macros: { protein: todayProtein, carbs: todayCarbs, fat: todayFat },
    streak: Math.max(workoutStreak, nutritionStreak),
    completedWorkouts: weeklyWorkouts.length,
    recentLogs: todayFood.map(l => ({
      id: l.id,
      food: l.meal,
      calories: l.calories ?? 0,
      time: new Date(l.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    })),
    // Web fields (backwards compat)
    workoutStreak,
    nutritionStreak,
    overallStreak: Math.min(workoutStreak, nutritionStreak),
    weeklyCalories: todayFood.reduce((s, f) => s + (f.calories || 0), 0),
    weeklyWorkouts: weeklyWorkouts.length,
    disciplineScore: profile?.disciplineScore || 50,
    behaviorSummary,
    profile: profile ? { goal: profile.goal, name: user?.name } : null,
  })
}
