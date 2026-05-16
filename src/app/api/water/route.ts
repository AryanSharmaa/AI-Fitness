import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserPlan } from '@/lib/plan'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const plan = await getUserPlan(userId, session.user.email)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (plan === 'pro') {
    // Pro: return today + last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const logs = await prisma.waterLog.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      orderBy: { date: 'asc' },
    })
    const todayTotal = logs
      .filter(l => l.date >= today)
      .reduce((s, l) => s + l.amount, 0)
    return NextResponse.json({ todayTotal, logs, plan })
  }

  // Free: today only
  const logs = await prisma.waterLog.findMany({
    where: { userId, date: { gte: today } },
    orderBy: { date: 'asc' },
  })
  const todayTotal = logs.reduce((s, l) => s + l.amount, 0)
  return NextResponse.json({ todayTotal, logs, plan })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const { amount } = await req.json()
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  const log = await prisma.waterLog.create({
    data: { userId, amount: Math.round(amount) },
  })
  return NextResponse.json({ log })
}
