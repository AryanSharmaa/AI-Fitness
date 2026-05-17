import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserPlan } from '@/lib/plan'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  const [plan, profile] = await Promise.all([
    getUserPlan(userId, session.user.email),
    prisma.userProfile.findUnique({ where: { userId }, select: { height: true, goalWeight: true } }),
  ])

  if (plan === 'pro') {
    const logs = await prisma.bodyLog.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
      take: 60,
    })
    return NextResponse.json({ logs, plan, height: profile?.height, goalWeight: profile?.goalWeight })
  }

  const latest = await prisma.bodyLog.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json({ logs: latest ? [latest] : [], plan, height: profile?.height, goalWeight: profile?.goalWeight })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  const plan = await getUserPlan(userId, session.user.email)

  const body = await req.json()
  const { weight, waist, chest, arms, hips, notes, goalWeight } = body

  const data: any = { userId, weight: weight ? parseFloat(weight) : undefined }
  if (plan === 'pro') {
    data.waist = waist ? parseFloat(waist) : undefined
    data.chest = chest ? parseFloat(chest) : undefined
    data.arms = arms ? parseFloat(arms) : undefined
    data.hips = hips ? parseFloat(hips) : undefined
    data.notes = notes || undefined
  }

  const ops: Promise<any>[] = [prisma.bodyLog.create({ data })]
  if (goalWeight) {
    ops.push(prisma.userProfile.update({ where: { userId }, data: { goalWeight: parseFloat(goalWeight) } }))
  }
  const [log] = await Promise.all(ops)
  return NextResponse.json({ log })
}
