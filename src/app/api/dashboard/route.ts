import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getBehaviorSummary } from '@/lib/engines/behavior'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [streaks, weeklyWorkouts, weeklyFood, profile, behaviorLogs] = await Promise.all([
    prisma.streak.findMany({ where: { userId } }),
    prisma.workoutLog.findMany({
      where: { userId, date: { gte: sevenDaysAgo }, completed: true },
    }),
    prisma.foodLog.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
    }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.behaviorLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 20,
    }),
  ])

  const workoutStreak = streaks.find(s => s.type === 'workout')?.currentDays || 0
  const nutritionStreak = streaks.find(s => s.type === 'nutrition')?.currentDays || 0
  const weeklyCalories = weeklyFood.reduce((s, f) => s + (f.calories || 0), 0)

  const behaviorSummary = getBehaviorSummary(
    behaviorLogs.map(l => ({ event: l.event as any, date: l.date, details: l.details || undefined }))
  )

  return NextResponse.json({
    workoutStreak,
    nutritionStreak,
    overallStreak: Math.min(workoutStreak, nutritionStreak),
    weeklyCalories,
    weeklyWorkouts: weeklyWorkouts.length,
    disciplineScore: profile?.disciplineScore || 50,
    behaviorSummary,
    profile: profile ? {
      goal: profile.goal,
      name: session.user.name,
    } : null,
  })
}
