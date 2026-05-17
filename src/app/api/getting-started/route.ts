import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const [profile, user] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
  ])
  const joinedAt = user?.createdAt || new Date()
  const joinedDaysAgo = Math.floor((Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24))

  // After 30 days, hide the checklist regardless
  if (joinedDaysAgo > 30) {
    return NextResponse.json({ hide: true })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [foodLog, workoutLog, streak, message] = await Promise.all([
    prisma.foodLog.findFirst({ where: { userId } }),
    prisma.workoutLog.findFirst({ where: { userId, completed: true } }),
    prisma.streak.findFirst({ where: { userId, type: 'workout', currentDays: { gte: 3 } } }),
    prisma.message.findFirst({ where: { userId } }),
  ])

  const profileComplete = !!(profile?.age && profile?.height && profile?.weight && profile?.goal)
  const hasFoodLog = !!foodLog
  const hasWorkoutLog = !!workoutLog
  const hasStreak3 = !!streak
  const hasChat = !!message

  const allDone = profileComplete && hasFoodLog && hasWorkoutLog && hasStreak3 && hasChat

  return NextResponse.json({
    hide: allDone,
    joinedDaysAgo,
    profileComplete,
    hasFoodLog,
    hasWorkoutLog,
    hasStreak3,
    hasChat,
  })
}
