import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { selectWorkout, formatWorkoutForDisplay } from '@/lib/engines/workout'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  if (action === 'suggest') {
    const [profile, recentWorkouts, recentBehavior] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.workoutLog.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      prisma.behaviorLog.findMany({
        where: { userId, event: { in: ['missed_workout', 'injury'] } },
        orderBy: { date: 'desc' },
        take: 3,
      }),
    ])

    const hasInjury = recentBehavior.some(b => b.event === 'injury')
    const lastWorkout = recentWorkouts[0]
    const hasDOMS = lastWorkout &&
      (new Date().getTime() - lastWorkout.date.getTime()) < 48 * 60 * 60 * 1000 &&
      lastWorkout.type === 'strength'

    const workout = selectWorkout({
      equipment: profile?.equipmentAccess || 'none',
      sleepHours: profile?.sleepHours || 7,
      goal: profile?.goal || 'maintenance',
      lastWorkoutType: lastWorkout?.type,
      hasDOMS: !!hasDOMS,
      hasInjury,
      hasTime: 45,
      isNightShift: profile?.workSchedule === 'night',
    })

    return NextResponse.json({ workout, formatted: formatWorkoutForDisplay(workout) })
  }

  // Get workout logs
  const { searchParams: sp } = new URL(req.url)
  const date = sp.get('date') || new Date().toISOString().split('T')[0]
  const startOfDay = new Date(date + 'T00:00:00.000Z')
  const endOfDay = new Date(date + 'T23:59:59.999Z')

  const logs = await prisma.workoutLog.findMany({
    where: { userId, date: { gte: startOfDay, lte: endOfDay } },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json({ logs })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const body = await req.json()
  const { type, duration, exercises, notes, completed, skipped, skipReason } = body

  const log = await prisma.workoutLog.create({
    data: {
      userId,
      type: type || 'general',
      duration,
      exercises: exercises || [],
      notes,
      completed: completed ?? true,
      skipped: skipped ?? false,
      skipReason,
    },
  })

  // Record behavior event
  const event = skipped ? 'missed_workout' : 'completed_workout'
  await prisma.behaviorLog.create({
    data: {
      userId,
      event,
      details: skipped ? skipReason : `${type} for ${duration} min`,
    },
  })

  // Update streak
  if (!skipped) {
    const streak = await prisma.streak.findFirst({ where: { userId, type: 'workout' } })
    if (streak) {
      const newCurrent = streak.currentDays + 1
      await prisma.streak.update({
        where: { id: streak.id },
        data: {
          currentDays: newCurrent,
          bestDays: Math.max(streak.bestDays, newCurrent),
          lastActive: new Date(),
        },
      })
    } else {
      await prisma.streak.create({ data: { userId, type: 'workout', currentDays: 1, bestDays: 1 } })
    }
  } else {
    await prisma.streak.updateMany({
      where: { userId, type: 'workout' },
      data: { currentDays: 0 },
    })
  }

  return NextResponse.json({ log })
}
