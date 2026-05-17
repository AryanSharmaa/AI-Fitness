import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAnySession } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const anySession = await getAnySession(req)
  if (!anySession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [profile, user, workouts, foodLogs, streaks] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: anySession.userId } }),
    prisma.user.findUnique({ where: { id: anySession.userId }, select: { name: true, email: true, plan: true } }),
    prisma.workoutLog.count({ where: { userId: anySession.userId } }),
    prisma.foodLog.count({ where: { userId: anySession.userId } }),
    prisma.streak.findMany({ where: { userId: anySession.userId } }),
  ])

  const streak = Math.max(0, ...streaks.map(s => s.currentDays || 0))

  return NextResponse.json({
    profile,
    // Mobile-friendly top-level fields
    name: user?.name ?? null,
    email: user?.email ?? anySession.email,
    plan: (user?.plan === 'pro' ? 'PRO' : 'FREE') as 'FREE' | 'PRO',
    goals: profile?.goal ?? null,
    currentWeight: profile?.weight ?? null,
    targetWeight: profile?.goalWeight ?? null,
    streak,
    totalWorkouts: workouts,
    totalFoodLogs: foodLogs,
  })
}

export async function POST(req: NextRequest) {
  const anySession = await getAnySession(req)
  if (!anySession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = anySession.userId

  const body = await req.json()
  const {
    age, height, weight, goalWeight, gender, goal, workSchedule,
    sleepHours, foodPreference, medicalNotes, equipmentAccess,
    cookingSkill, onboardingDone,
    proteinGoal, carbsGoal, fatGoal,
  } = body

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
