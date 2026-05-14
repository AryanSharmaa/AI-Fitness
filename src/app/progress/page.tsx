import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProgressCharts from '@/components/dashboard/ProgressCharts'

export default async function ProgressPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } })
  if (!profile?.onboardingDone) redirect('/onboarding')

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [foodLogs, workoutLogs, streaks] = await Promise.all([
    prisma.foodLog.findMany({
      where: { userId: session.user.id, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    }),
    prisma.workoutLog.findMany({
      where: { userId: session.user.id, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    }),
    prisma.streak.findMany({ where: { userId: session.user.id } }),
  ])

  // Aggregate daily
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

  return (
    <ProgressCharts
      dailyData={dailyData}
      bestStreak={bestWorkoutStreak}
      currentStreak={currentWorkoutStreak}
    />
  )
}
