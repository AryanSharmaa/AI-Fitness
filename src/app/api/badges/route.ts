import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeBadges } from '@/lib/badges'
import { getUserPlan } from '@/lib/plan'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  const [user, workoutLogs, foodLogs, streaks] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.workoutLog.findMany({
      where: { userId, completed: true },
      select: { date: true },
    }),
    prisma.foodLog.findMany({
      where: { userId },
      select: { date: true, calories: true },
    }),
    prisma.streak.findMany({ where: { userId } }),
  ])

  const plan = await getUserPlan(userId, session.user.email)

  const workoutDates = [...new Set(workoutLogs.map(l => l.date.toISOString().split('T')[0]))]
  const foodDates = [...new Set(foodLogs.map(l => l.date.toISOString().split('T')[0]))]
  const totalCalories = foodLogs.reduce((sum, l) => sum + (l.calories || 0), 0)
  const workoutStreak = streaks.find(s => s.type === 'workout')?.currentDays || 0
  const bestWorkoutStreak = streaks.find(s => s.type === 'workout')?.bestDays || 0
  const joinedDaysAgo = user ? Math.floor((Date.now() - user.createdAt.getTime()) / 86400000) : 0

  const badges = computeBadges({
    totalWorkouts: workoutLogs.length,
    totalFoodLogs: foodLogs.length,
    workoutStreak,
    bestWorkoutStreak,
    totalCalories,
    totalProtein: 0,
    joinedDaysAgo,
    plan,
    workoutDates,
    foodDates,
  })

  return NextResponse.json({ badges, plan })
}
