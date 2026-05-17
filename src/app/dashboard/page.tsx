import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import StatsCards from '@/components/dashboard/StatsCard'
import WaterTracker from '@/components/water/WaterTracker'
import BodyTracker from '@/components/body/BodyTracker'
import MonthlyReport from '@/components/dashboard/MonthlyReport'
import GettingStartedChecklist from '@/components/dashboard/GettingStartedChecklist'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, UtensilsCrossed, Dumbbell, TrendingUp, ArrowRight, Zap } from 'lucide-react'
import { getUserPlan } from '@/lib/plan'

async function getDashboardData(userId: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [streaks, weeklyWorkouts, weeklyFood, profile, behaviorLogs] = await Promise.all([
    prisma.streak.findMany({ where: { userId } }),
    prisma.workoutLog.findMany({ where: { userId, date: { gte: sevenDaysAgo }, completed: true } }),
    prisma.foodLog.findMany({ where: { userId, date: { gte: sevenDaysAgo } } }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.behaviorLog.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 20 }),
  ])

  const workoutStreak = streaks.find(s => s.type === 'workout')?.currentDays || 0
  const nutritionStreak = streaks.find(s => s.type === 'nutrition')?.currentDays || 0
  const weeklyCalories = weeklyFood.reduce((s, f) => s + (f.calories || 0), 0)
  const weeklyCaloriesBurned = weeklyWorkouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0)

  return {
    workoutStreak,
    nutritionStreak,
    overallStreak: Math.min(workoutStreak, nutritionStreak),
    weeklyCalories,
    weeklyWorkouts: weeklyWorkouts.length,
    weeklyCaloriesBurned,
    disciplineScore: profile?.disciplineScore || 50,
    profile: profile ? { goal: profile.goal || undefined, name: undefined } : null,
  }
}

const QUICK_LINKS = [
  { href: '/chat', icon: MessageCircle, label: 'Chat with AI Coach', color: 'emerald', desc: 'Ask anything, log meals, get advice' },
  { href: '/food-log', icon: UtensilsCrossed, label: 'Log a Meal', color: 'orange', desc: 'Track what you ate today' },
  { href: '/workout', icon: Dumbbell, label: 'Today\'s Workout', color: 'blue', desc: 'See your personalized plan' },
  { href: '/progress', icon: TrendingUp, label: 'View Progress', color: 'purple', desc: 'Charts and trends over time' },
]

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } })
  if (!profile?.onboardingDone) redirect('/onboarding')

  const [data, plan] = await Promise.all([
    getDashboardData(session.user.id),
    getUserPlan(session.user.id, session.user.email),
  ])
  const dataWithName = { ...data, profile: data.profile ? { ...data.profile, name: session.user.name || undefined } : undefined }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Pro badge or upgrade nudge */}
      {plan === 'pro' ? (
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500 text-white">Pro</Badge>
          <span className="text-xs text-muted-foreground">All features unlocked</span>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-medium">Upgrade to Pro</p>
            <p className="text-xs text-muted-foreground">Water history, AI reports, unlimited chat & more</p>
          </div>
          <Button size="sm" asChild className="shrink-0 bg-emerald-600 hover:bg-emerald-700">
            <Link href="/upgrade"><Zap className="h-3.5 w-3.5 mr-1" />₹499/mo</Link>
          </Button>
        </div>
      )}

      <GettingStartedChecklist />

      <StatsCards data={dataWithName} />

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {QUICK_LINKS.map(({ href, icon: Icon, label, desc, color }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full">
              <CardContent className="pt-4">
                <Icon className={`h-5 w-5 mb-2 text-${color}-500`} />
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Water tracker */}
      <WaterTracker />

      {/* Body tracker */}
      <BodyTracker />

      <MonthlyReport />

      {/* AI nudge card */}
      <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
        <CardContent className="pt-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Your AI Coach is ready</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tell it how you're feeling, what you ate, or ask for today's plan.
            </p>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href="/chat">
              Open Chat <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
