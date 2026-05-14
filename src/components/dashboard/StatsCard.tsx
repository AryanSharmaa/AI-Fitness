'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Flame, Dumbbell, Apple, TrendingUp, Brain } from 'lucide-react'

interface DashboardData {
  workoutStreak: number
  nutritionStreak: number
  overallStreak: number
  weeklyCalories: number
  weeklyWorkouts: number
  disciplineScore: number
  behaviorSummary?: string
  profile?: { goal?: string; name?: string }
}

export default function StatsCards({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          {getGreeting()}, {data.profile?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {getMotivationalLine(data.disciplineScore, data.workoutStreak)}
        </p>
      </div>

      {/* Streak cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Workout Streak"
          value={`${data.workoutStreak}d`}
          icon={<Flame className="h-4 w-4 text-orange-500" />}
          color="orange"
        />
        <StatCard
          title="Nutrition Streak"
          value={`${data.nutritionStreak}d`}
          icon={<Apple className="h-4 w-4 text-green-500" />}
          color="green"
        />
        <StatCard
          title="This Week"
          value={`${data.weeklyWorkouts} workouts`}
          icon={<Dumbbell className="h-4 w-4 text-blue-500" />}
          color="blue"
        />
        <StatCard
          title="Weekly Calories"
          value={`${(data.weeklyCalories / 1000).toFixed(1)}k`}
          icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
          color="purple"
        />
      </div>

      {/* Discipline Score */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-sm">Discipline Score</span>
            </div>
            <span className="font-bold text-emerald-600">{Math.round(data.disciplineScore)}/100</span>
          </div>
          <Progress value={data.disciplineScore} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1.5">
            {getDisciplineLabel(data.disciplineScore)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title, value, icon, color
}: {
  title: string
  value: string
  icon: React.ReactNode
  color: string
}) {
  const bg: Record<string, string> = {
    orange: 'bg-orange-50 dark:bg-orange-950/30',
    green: 'bg-green-50 dark:bg-green-950/30',
    blue: 'bg-blue-50 dark:bg-blue-950/30',
    purple: 'bg-purple-50 dark:bg-purple-950/30',
  }
  return (
    <Card className={bg[color]}>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs text-muted-foreground">{title}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getMotivationalLine(score: number, streak: number): string {
  if (streak >= 7) return `${streak}-day streak 🔥 You're on fire — keep going.`
  if (streak >= 3) return `${streak} days in a row. Building momentum.`
  if (score >= 70) return "Strong week. Stay consistent."
  if (score >= 40) return "Room to grow. One good decision at a time."
  return "Every comeback starts with today. Let's go."
}

function getDisciplineLabel(score: number): string {
  if (score >= 80) return "Outstanding consistency — you're setting the bar"
  if (score >= 60) return "Good momentum — a few more wins and you'll be unstoppable"
  if (score >= 40) return "Building your base — small wins count"
  if (score >= 20) return "Rough patch — your AI coach has a plan for this"
  return "Fresh start — today is day one"
}
