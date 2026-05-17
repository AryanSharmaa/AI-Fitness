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

  if (plan === 'pro') {
    const logs = await prisma.bodyLog.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
      take: 60,
    })
    return NextResponse.json({ logs, plan })
  }

  // Free: latest entry only
  const latest = await prisma.bodyLog.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json({ logs: latest ? [latest] : [], plan })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  const plan = await getUserPlan(userId, session.user.email)

  const body = await req.json()
  const { weight, waist, chest, arms, hips, notes } = body

  // Free users can only log weight
  const data: any = { userId, weight: weight ? parseFloat(weight) : undefined }
  if (plan === 'pro') {
    data.waist = waist ? parseFloat(waist) : undefined
    data.chest = chest ? parseFloat(chest) : undefined
    data.arms = arms ? parseFloat(arms) : undefined
    data.hips = hips ? parseFloat(hips) : undefined
    data.notes = notes || undefined
  }

  const log = await prisma.bodyLog.create({ data })
  return NextResponse.json({ log })
}
