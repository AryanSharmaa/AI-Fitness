import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const active = await prisma.fastingLog.findFirst({
    where: { userId, endTime: null },
    orderBy: { startTime: 'desc' },
  })

  const recent = await prisma.fastingLog.findMany({
    where: { userId, endTime: { not: null } },
    orderBy: { startTime: 'desc' },
    take: 7,
  })

  return NextResponse.json({ active, recent })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const { action, targetHours, notes } = await req.json()

  if (action === 'start') {
    // Cancel any existing active fast
    await prisma.fastingLog.updateMany({
      where: { userId, endTime: null },
      data: { endTime: new Date(), completed: false },
    })
    const log = await prisma.fastingLog.create({
      data: { userId, startTime: new Date(), targetHours: targetHours || 16 },
    })
    return NextResponse.json({ log })
  }

  if (action === 'end') {
    const active = await prisma.fastingLog.findFirst({ where: { userId, endTime: null } })
    if (!active) return NextResponse.json({ error: 'No active fast' }, { status: 404 })

    const hoursElapsed = (Date.now() - active.startTime.getTime()) / (1000 * 60 * 60)
    const completed = hoursElapsed >= active.targetHours

    const log = await prisma.fastingLog.update({
      where: { id: active.id },
      data: { endTime: new Date(), completed, notes },
    })
    return NextResponse.json({ log, completed, hoursElapsed: Math.round(hoursElapsed * 10) / 10 })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
