import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json({ profile })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const body = await req.json()
  const {
    age, height, weight, goalWeight, gender, goal, workSchedule,
    sleepHours, foodPreference, medicalNotes, equipmentAccess,
    cookingSkill, onboardingDone,
    proteinGoal, carbsGoal, fatGoal,
  } = body

  // Compute risk profile
  let riskProfile = 'moderate'
  if (workSchedule === 'night' || workSchedule === 'rotating') riskProfile = 'high'
  if (sleepHours && sleepHours < 6) riskProfile = 'high'
  if (goal === 'discipline') riskProfile = 'moderate'

  const profile = await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId, age, height, weight, goalWeight, gender, goal, workSchedule,
      sleepHours, foodPreference, medicalNotes, equipmentAccess,
      cookingSkill, riskProfile, onboardingDone: onboardingDone ?? false,
      ...(proteinGoal != null && { proteinGoal }),
      ...(carbsGoal != null && { carbsGoal }),
      ...(fatGoal != null && { fatGoal }),
    },
    update: {
      age, height, weight, goalWeight, gender, goal, workSchedule,
      sleepHours, foodPreference, medicalNotes, equipmentAccess,
      cookingSkill, riskProfile, onboardingDone: onboardingDone ?? false,
      ...(proteinGoal != null && { proteinGoal }),
      ...(carbsGoal != null && { carbsGoal }),
      ...(fatGoal != null && { fatGoal }),
      updatedAt: new Date(),
    },
  })

  return NextResponse.json({ profile })
}
