import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDailyCalorieTarget } from '@/lib/engines/nutrition'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } })
  const calorieGoal = getDailyCalorieTarget({
    age: profile?.age ?? undefined,
    weight: profile?.weight ?? undefined,
    height: profile?.height ?? undefined,
    gender: profile?.gender ?? undefined,
    goal: profile?.goal ?? undefined,
    workSchedule: profile?.workSchedule ?? undefined,
  })

  return NextResponse.json({
    calorieGoal,
    proteinGoal: profile?.proteinGoal ?? Math.round((profile?.weight ?? 70) * 1.6),
    carbsGoal: profile?.carbsGoal ?? Math.round(calorieGoal * 0.45 / 4),
    fatGoal: profile?.fatGoal ?? Math.round(calorieGoal * 0.25 / 9),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { proteinGoal, carbsGoal, fatGoal } = await req.json()

  const profile = await prisma.userProfile.update({
    where: { userId: session.user.id },
    data: {
      proteinGoal: proteinGoal ? parseInt(proteinGoal) : undefined,
      carbsGoal: carbsGoal ? parseInt(carbsGoal) : undefined,
      fatGoal: fatGoal ? parseInt(fatGoal) : undefined,
    },
  })

  return NextResponse.json({ proteinGoal: profile.proteinGoal, carbsGoal: profile.carbsGoal, fatGoal: profile.fatGoal })
}
