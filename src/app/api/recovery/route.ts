import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcRecoveryScore } from '@/lib/recovery'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const now = new Date()
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)

  const [profile, recentWorkouts, recentBehavior, todayMood] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.workoutLog.findMany({ where: { userId, date: { gte: threeDaysAgo } }, orderBy: { date: 'desc' } }),
    prisma.behaviorLog.findMany({ where: { userId, date: { gte: threeDaysAgo }, event: { in: ['missed_workout', 'injury'] } } }),
    prisma.moodLog.findFirst({ where: { userId, date: { gte: todayStart } }, orderBy: { date: 'desc' } }),
  ])

  const missedLast3Days = recentBehavior.filter(b => b.event === 'missed_workout').length
  const hasInjury = recentBehavior.some(b => b.event === 'injury')
  const hasDOMSRisk = recentWorkouts.some(w =>
    w.completed && w.date > fortyEightHoursAgo && ['strength', 'hiit'].includes(w.type)
  )

  // Count consecutive workout days from today backwards
  let consecutiveWorkoutDays = 0
  for (let i = 0; i < 14; i++) {
    const dayStart = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart); dayEnd.setHours(23, 59, 59, 999)
    const hasWorkout = recentWorkouts.some(w => w.completed && w.date >= dayStart && w.date <= dayEnd)
    if (hasWorkout) consecutiveWorkoutDays++
    else break
  }

  const result = calcRecoveryScore({
    sleepHours: profile?.sleepHours || 7,
    workoutStreak: 0,
    missedLast3Days,
    hasDOMSRisk,
    hasInjury,
    consecutiveWorkoutDays,
    lastMoodScore: todayMood?.energy ?? undefined,
  })

  return NextResponse.json(result)
}
