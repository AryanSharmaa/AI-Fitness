import { NextRequest, NextResponse } from 'next/server'
import { getAnySession } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const anySession = await getAnySession(req)
  if (!anySession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const start = new Date(date + 'T00:00:00.000Z')
  const end = new Date(date + 'T23:59:59.999Z')

  const logs = await prisma.workoutLog.findMany({
    where: { userId: anySession.userId, date: { gte: start, lte: end } },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(
    logs.map((l) => ({
      id: l.id,
      exercise: (l.exercises as any[])?.[0]?.name ?? l.type,
      sets: (l.exercises as any[])?.[0]?.sets ?? 1,
      reps: (l.exercises as any[])?.[0]?.reps ?? 0,
      weight: (l.exercises as any[])?.[0]?.weight ?? null,
      duration: l.duration ?? null,
      type: l.type,
      loggedAt: l.date,
    })),
  )
}

export async function POST(req: NextRequest) {
  const anySession = await getAnySession(req)
  if (!anySession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = anySession.userId

  const { exercise, sets, reps, weight, duration, type } = await req.json()
  if (!exercise) return NextResponse.json({ error: 'exercise required' }, { status: 400 })

  const log = await prisma.workoutLog.create({
    data: {
      userId,
      type: type || 'Strength',
      duration: duration ?? null,
      exercises: [{ name: exercise, sets: sets ?? 1, reps: reps ?? 0, weight: weight ?? null }],
      completed: true,
      skipped: false,
    },
  })

  await prisma.behaviorLog.create({
    data: {
      userId,
      event: 'completed_workout',
      details: `${exercise} ${sets}x${reps}`,
    },
  })

  return NextResponse.json({ id: log.id, exercise, sets, reps, weight, duration, type })
}
