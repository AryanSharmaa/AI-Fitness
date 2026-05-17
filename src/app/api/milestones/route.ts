import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MILESTONES, checkNewMilestones } from '@/lib/milestones'
import type { UserStats } from '@/lib/milestones'

// prisma.milestone is not yet in the generated types (pending `prisma generate`),
// so we access it via a typed proxy helper to avoid TypeScript errors.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

function calcCalorieGoal(profile: {
  weight?: number | null
  height?: number | null
  age?: number | null
  gender?: string | null
  goal?: string | null
}): number {
  const { weight = 70, height = 170, age = 28, gender = 'male', goal } = profile
  if (!weight || !height || !age) return 2000
  const bmr =
    gender === 'female'
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5
  const tdee = Math.round(bmr * 1.55)
  if (goal === 'fat_loss') return Math.round(tdee * 0.85)
  if (goal === 'muscle') return Math.round(tdee * 1.1)
  return tdee
}

// GET: return user milestones, mark unseen ones as seen
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  const milestones: { id: string; type: string; title: string; seenAt: Date | null; earnedAt: Date }[] =
    await db.milestone.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    })

  // Mark unseen as seen after fetching
  const unseenIds = milestones
    .filter((m) => m.seenAt === null)
    .map((m) => m.id)

  if (unseenIds.length > 0) {
    await db.milestone.updateMany({
      where: { id: { in: unseenIds } },
      data: { seenAt: new Date() },
    })
  }

  return NextResponse.json({ milestones, total: milestones.length })
}

// POST: check for and award new milestones
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  const [
    profile,
    streaks,
    workoutLogs,
    foodLogs,
    waterLogs,
    bodyLogs,
    earnedMilestones,
  ] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.streak.findMany({ where: { userId } }),
    prisma.workoutLog.findMany({
      where: { userId, completed: true },
      select: { id: true },
    }),
    prisma.foodLog.findMany({
      where: { userId },
      select: { date: true, calories: true },
    }),
    prisma.waterLog.findMany({
      where: { userId },
      select: { id: true },
    }),
    prisma.bodyLog.findMany({
      where: { userId },
      select: { weight: true, date: true },
      orderBy: { date: 'asc' },
    }),
    db.milestone.findMany({
      where: { userId },
      select: { type: true },
    }) as Promise<{ type: string }[]>,
  ])

  const workoutStreak =
    streaks.find((s) => s.type === 'workout')?.currentDays ?? 0
  const totalWorkouts = workoutLogs.length
  const totalFoodLogs = foodLogs.length
  const totalWaterLogs = waterLogs.length

  // Weight lost: first recorded weight minus most recent recorded weight
  let weightLost = 0
  const weightEntries = bodyLogs.filter((b) => b.weight !== null)
  if (weightEntries.length >= 2) {
    const startWeight = weightEntries[0].weight as number
    const latestWeight = weightEntries[weightEntries.length - 1].weight as number
    weightLost = Math.max(0, startWeight - latestWeight)
  }

  // Calorie goal hit days: days where sum of food log calories >= calorieGoal * 0.9
  const calorieGoal = calcCalorieGoal(profile ?? {})
  const threshold = calorieGoal * 0.9

  const caloriesByDay = new Map<string, number>()
  for (const log of foodLogs) {
    const day = log.date.toISOString().split('T')[0]
    caloriesByDay.set(day, (caloriesByDay.get(day) ?? 0) + (log.calories ?? 0))
  }
  let calorieGoalHitDays = 0
  for (const total of caloriesByDay.values()) {
    if (total >= threshold) calorieGoalHitDays++
  }

  const stats: UserStats = {
    workoutStreak,
    totalWorkouts,
    totalFoodLogs,
    weightLost,
    calorieGoalHitDays,
    totalWaterLogs,
  }

  const earnedTypes = (earnedMilestones as { type: string }[]).map((m) => m.type)
  const newMilestones = checkNewMilestones(stats, earnedTypes)

  if (newMilestones.length > 0) {
    await db.milestone.createMany({
      data: newMilestones.map((m) => ({
        userId,
        type: m.type,
        title: m.title,
      })),
    })
  }

  // Return the full MilestoneDefinition shape (with icon) for the client
  const newMilestonesWithIcon = newMilestones.map((m) => {
    const def = MILESTONES.find((d) => d.type === m.type)
    return { type: m.type, title: m.title, icon: def?.icon ?? '🏅' }
  })

  return NextResponse.json({ newMilestones: newMilestonesWithIcon })
}
