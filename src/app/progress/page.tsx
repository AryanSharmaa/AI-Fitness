import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProgressCharts from '@/components/dashboard/ProgressCharts'
import ActivityHeatmap from '@/components/progress/ActivityHeatmap'
import ActivitySummary from '@/components/progress/ActivitySummary'
import BadgesPanel from '@/components/badges/BadgesPanel'

export default async function ProgressPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } })
  if (!profile?.onboardingDone) redirect('/onboarding')

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

  const [foodLogs, workoutLogs, streaks, allWorkouts, allFood] = await Promise.all([
    prisma.foodLog.findMany({
      where: { userId: session.user.id, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    }),
    prisma.workoutLog.findMany({
      where: { userId: session.user.id, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    }),
    prisma.streak.findMany({ where: { userId: session.user.id } }),
    prisma.workoutLog.findMany({
      where: { userId: session.user.id, date: { gte: yearAgo } },
      select: { date: true, completed: true, type: true, duration: true, caloriesBurned: true, steps: true, distance: true },
    }),
    prisma.foodLog.findMany({
      where: { userId: session.user.id, date: { gte: yearAgo } },
      select: { date: true },
    }),
  ])

  const dailyMap: Record<string, { date: string; calories: number; workouts: number; protein: number }> = {}
  for (const log of foodLogs) {
    const d = log.date.toISOString().split('T')[0]
    if (!dailyMap[d]) dailyMap[d] = { date: d, calories: 0, workouts: 0, protein: 0 }
    dailyMap[d].calories += log.calories || 0
    dailyMap[d].protein += log.protein || 0
  }
  for (const log of workoutLogs) {
    const d = log.date.toISOString().split('T')[0]
    if (!dailyMap[d]) dailyMap[d] = { date: d, calories: 0, workouts: 0, protein: 0 }
    if (log.completed) dailyMap[d].workouts++
  }

  const dailyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))
  const bestWorkoutStreak = streaks.find(s => s.type === 'workout')?.bestDays || 0
  const currentWorkoutStreak = streaks.find(s => s.type === 'workout')?.currentDays || 0

  const heatmapWorkouts = allWorkouts.map(l => ({ date: l.date.toISOString(), completed: l.completed }))
  const heatmapFood = allFood.map(l => ({ date: l.date.toISOString() }))
  const activityLogs = allWorkouts.map(l => ({
    date: l.date.toISOString(),
    completed: l.completed,
    type: l.type,
    duration: l.duration,
    caloriesBurned: l.caloriesBurned,
    steps: l.steps,
    distance: l.distance,
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <ActivitySummary workoutLogs={activityLogs} />
      <ActivityHeatmap workoutLogs={heatmapWorkouts} foodLogs={heatmapFood} />
      <BadgesPanel />
      <ProgressCharts
        dailyData={dailyData}
        bestStreak={bestWorkoutStreak}
        currentStreak={currentWorkoutStreak}
      />
    </div>
  )
}
