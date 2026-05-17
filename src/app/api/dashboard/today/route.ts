import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function calcCalorieGoal(profile: {
  weight?: number | null
  height?: number | null
  age?: number | null
  gender?: string | null
  goal?: string | null
}): number {
  const { weight = 70, height = 170, age = 28, gender = 'male', goal } = profile
  if (!weight || !height || !age) return 2000
  // Mifflin-St Jeor BMR
  const bmr = gender === 'female'
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5
  const tdee = Math.round(bmr * 1.55) // moderate activity
  if (goal === 'fat_loss') return Math.round(tdee * 0.85)
  if (goal === 'muscle') return Math.round(tdee * 1.1)
  return tdee
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [profile, todayFood, todayWorkouts, todayWater, streaks, recentWorkouts] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.foodLog.findMany({ where: { userId, date: { gte: todayStart, lte: todayEnd } } }),
    prisma.workoutLog.findMany({ where: { userId, date: { gte: todayStart, lte: todayEnd } } }),
    prisma.waterLog.findMany({ where: { userId, date: { gte: todayStart, lte: todayEnd } } }),
    prisma.streak.findMany({ where: { userId } }),
    prisma.workoutLog.findMany({
      where: { userId, date: { gte: sevenDaysAgo }, completed: true },
      orderBy: { date: 'desc' },
      take: 10,
    }),
  ])

  const calorieGoal = calcCalorieGoal(profile || {})

  // Auto-calculate macro goals if not set
  const proteinGoal = profile?.proteinGoal || Math.round(calorieGoal * 0.3 / 4)
  const carbsGoal = profile?.carbsGoal || Math.round(calorieGoal * 0.45 / 4)
  const fatGoal = profile?.fatGoal || Math.round(calorieGoal * 0.25 / 9)

  const todayCaloriesConsumed = todayFood.reduce((s, f) => s + (f.calories || 0), 0)
  const protein = Math.round(todayFood.reduce((s, f) => s + (f.protein || 0), 0))
  const carbs = Math.round(todayFood.reduce((s, f) => s + (f.carbs || 0), 0))
  const fat = Math.round(todayFood.reduce((s, f) => s + (f.fat || 0), 0))

  const waterMl = todayWater.reduce((s, w) => s + w.amount, 0)

  const completedToday = todayWorkouts.filter(w => w.completed)
  const todayCaloriesBurned = completedToday.reduce((s, w) => s + (w.caloriesBurned || 0), 0)
  const todayActiveMinutes = completedToday.reduce((s, w) => s + (w.duration || 0), 0)
  const todaySteps = completedToday.reduce((s, w) => s + (w.steps || 0), 0)

  const workoutStreak = streaks.find(s => s.type === 'workout')?.currentDays || 0

  // Build activity items for today
  const activities = completedToday.map(w => {
    const exercises = Array.isArray(w.exercises) ? w.exercises as any[] : []
    const typeName = w.type.charAt(0).toUpperCase() + w.type.slice(1)
    return {
      id: w.id,
      name: typeName,
      type: w.type,
      duration: w.duration || 0,
      caloriesBurned: w.caloriesBurned || 0,
      exerciseCount: exercises.length,
      distance: w.distance,
      steps: w.steps,
    }
  })

  // Recent feed (last 7 days workouts for Feed tab)
  const feed = recentWorkouts.map(w => {
    const exercises = Array.isArray(w.exercises) ? w.exercises as any[] : []
    return {
      id: w.id,
      type: w.type,
      duration: w.duration || 0,
      caloriesBurned: w.caloriesBurned || 0,
      exerciseCount: exercises.length,
      distance: w.distance,
      steps: w.steps,
      date: w.date.toISOString(),
    }
  })

  return NextResponse.json({
    name: session.user.name || session.user.email?.split('@')[0] || 'there',
    streak: workoutStreak,
    todaySteps,
    todayCaloriesBurned,
    todayActiveMinutes,
    todayCaloriesConsumed,
    calorieGoal,
    waterMl,
    waterGoalMl: 2500,
    protein,
    carbs,
    fat,
    proteinGoal,
    carbsGoal,
    fatGoal,
    activities,
    feed,
    todayFood,
  })
}
