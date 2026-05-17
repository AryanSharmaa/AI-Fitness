import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [todayLog, recentLogs] = await Promise.all([
    prisma.moodLog.findFirst({ where: { userId, date: { gte: todayStart } }, orderBy: { date: 'desc' } }),
    prisma.moodLog.findMany({ where: { userId, date: { gte: sevenDaysAgo } }, orderBy: { date: 'asc' } }),
  ])

  return NextResponse.json({ todayLog, recentLogs })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const { mood, energy, notes } = await req.json()
  if (!mood || !energy) return NextResponse.json({ error: 'mood and energy required' }, { status: 400 })

  // Upsert today's log
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const existing = await prisma.moodLog.findFirst({ where: { userId, date: { gte: todayStart } } })

  let log
  if (existing) {
    log = await prisma.moodLog.update({ where: { id: existing.id }, data: { mood, energy, notes } })
  } else {
    log = await prisma.moodLog.create({ data: { userId, mood, energy, notes } })
  }

  // Log low energy as behavior event so AI coach knows
  if (energy <= 2) {
    await prisma.behaviorLog.create({
      data: { userId, event: 'stress_day', details: `Low energy (${energy}/5), mood (${mood}/5)` },
    })
  }

  return NextResponse.json({ log })
}
