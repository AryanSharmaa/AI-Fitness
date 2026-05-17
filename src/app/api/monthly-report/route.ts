import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const now = new Date()
  const useCurrentMonth = now.getDate() <= 7
  const start = useCurrentMonth
    ? new Date(now.getFullYear(), now.getMonth(), 1)
    : new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = useCurrentMonth
    ? now
    : new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const monthLabel = start.toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  const [workoutLogs, foodLogs, streaks] = await Promise.all([
    prisma.workoutLog.findMany({ where: { userId, date: { gte: start, lte: end } } }),
    prisma.foodLog.findMany({ where: { userId, date: { gte: start, lte: end } } }),
    prisma.streak.findMany({ where: { userId, type: 'workout' } }),
  ])

  const completed = workoutLogs.filter(w => w.completed).length
  const skipped = workoutLogs.filter(w => w.skipped).length
  const total = completed + skipped
  const completionRate = total > 0 ? Math.round(completed / total * 100) : 0

  const foodDays = new Set(foodLogs.map(f => f.date.toISOString().split('T')[0])).size
  const totalCalories = foodLogs.reduce((s, f) => s + (f.calories || 0), 0)
  const avgDailyCalories = foodDays > 0 ? Math.round(totalCalories / foodDays) : 0
  const totalProtein = Math.round(foodLogs.reduce((s, f) => s + (f.protein || 0), 0))

  const typeCounts: Record<string, number> = {}
  for (const w of workoutLogs.filter(w => w.completed)) {
    typeCounts[w.type] = (typeCounts[w.type] || 0) + 1
  }
  const topWorkoutType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

  const streak = streaks[0]
  const bestStreak = streak?.bestDays || 0
  const currentStreak = streak?.currentDays || 0

  let highlight = ''
  if (completionRate >= 80) highlight = `Outstanding — ${completed} workouts at ${completionRate}% completion rate.`
  else if (bestStreak >= 7) highlight = `Hit a ${bestStreak}-day streak this month 🔥`
  else if (completionRate >= 50) highlight = `Solid month — ${completed} workouts logged. Keep building.`
  else if (completed > 0) highlight = `Every log counts. ${completed} workouts in the books.`
  else highlight = 'Start logging to see your monthly report come alive.'

  return NextResponse.json({
    monthLabel, workoutsCompleted: completed, workoutsSkipped: skipped,
    completionRate, daysWithFood: foodDays, avgDailyCalories,
    totalProtein, bestStreak, currentStreak, topWorkoutType, highlight,
    hasData: completed > 0 || foodDays > 0,
  })
}
