import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDailyCalorieTarget } from '@/lib/engines/nutrition'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const start = new Date(date + 'T00:00:00.000Z')
  const end = new Date(date + 'T23:59:59.999Z')

  const [logs, profile] = await Promise.all([
    prisma.foodLog.findMany({
      where: { userId: session.user.id, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    }),
    prisma.userProfile.findUnique({ where: { userId: session.user.id } }),
  ])

  const dailyTarget = getDailyCalorieTarget({
    age: profile?.age || undefined,
    weight: profile?.weight || undefined,
    height: profile?.height || undefined,
    gender: profile?.gender || undefined,
    goal: profile?.goal || undefined,
  })

  const totals = logs.reduce((acc, l) => ({
    calories: acc.calories + (l.calories || 0),
    protein: acc.protein + (l.protein || 0),
    carbs: acc.carbs + (l.carbs || 0),
    fat: acc.fat + (l.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  return NextResponse.json({ logs, totals, dailyTarget, date })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await prisma.foodLog.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ success: true })
}
