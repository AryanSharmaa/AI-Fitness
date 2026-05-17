'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, Footprints, Route, Zap, Clock, TrendingUp } from 'lucide-react'

interface WorkoutLog {
  type: string
  duration?: number | null
  completed: boolean
  caloriesBurned?: number | null
  steps?: number | null
  distance?: number | null
  date: string
}

interface Props {
  workoutLogs: WorkoutLog[]
}

const TYPE_EMOJI: Record<string, string> = {
  strength: '🏋️',
  hiit: '⚡',
  cardio: '🏃',
  yoga: '🧘',
  run: '🏃',
  walk: '🚶',
  cycling: '🚴',
  swimming: '🏊',
  recovery: '💆',
  general: '💪',
}

export default function ActivitySummary({ workoutLogs }: Props) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recent = workoutLogs.filter(l => l.completed && new Date(l.date) >= sevenDaysAgo)

  const totalBurn = recent.reduce((s, l) => s + (l.caloriesBurned || 0), 0)
  const totalSteps = recent.reduce((s, l) => s + (l.steps || 0), 0)
  const totalDistance = recent.reduce((s, l) => s + (l.distance || 0), 0)
  const totalMinutes = recent.reduce((s, l) => s + (l.duration || 0), 0)
  const activeDays = new Set(recent.map(l => l.date.slice(0, 10))).size

  // Type breakdown
  const typeCounts: Record<string, number> = {}
  for (const l of recent) {
    typeCounts[l.type] = (typeCounts[l.type] || 0) + 1
  }
  const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)

  // Daily burn bar chart (last 7 days)
  const days: { label: string; burn: number; steps: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    const dayLogs = workoutLogs.filter(l => l.date.slice(0, 10) === key && l.completed)
    days.push({
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      burn: dayLogs.reduce((s, l) => s + (l.caloriesBurned || 0), 0),
      steps: dayLogs.reduce((s, l) => s + (l.steps || 0), 0),
    })
  }
  const maxBurn = Math.max(...days.map(d => d.burn), 1)

  if (recent.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          This Week's Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Key stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-orange-50 dark:bg-orange-950/30 p-3 text-center">
            <Flame className="h-4 w-4 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-orange-500">{totalBurn > 0 ? totalBurn.toLocaleString() : '—'}</p>
            <p className="text-[11px] text-muted-foreground">kcal burned</p>
          </div>
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-3 text-center">
            <Footprints className="h-4 w-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-500">{totalSteps > 0 ? (totalSteps / 1000).toFixed(1) + 'k' : '—'}</p>
            <p className="text-[11px] text-muted-foreground">steps</p>
          </div>
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
            <Route className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-emerald-600">{totalDistance > 0 ? totalDistance.toFixed(1) + ' km' : '—'}</p>
            <p className="text-[11px] text-muted-foreground">distance</p>
          </div>
          <div className="rounded-xl bg-purple-50 dark:bg-purple-950/30 p-3 text-center">
            <Clock className="h-4 w-4 text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-purple-500">{totalMinutes}</p>
            <p className="text-[11px] text-muted-foreground">min active</p>
          </div>
        </div>

        {/* Daily calorie burn bars */}
        {totalBurn > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Daily calorie burn</p>
            <div className="flex items-end gap-1.5 h-16">
              {days.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: '44px' }}>
                    <div
                      className="w-full rounded-t-sm bg-orange-400 dark:bg-orange-500 transition-all"
                      style={{ height: d.burn > 0 ? `${Math.max((d.burn / maxBurn) * 44, 4)}px` : '2px', opacity: d.burn > 0 ? 1 : 0.2 }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active days + top types */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium">{activeDays} active days</span>
            <span className="text-xs text-muted-foreground">this week</span>
          </div>
          {topTypes.length > 0 && (
            <div className="flex gap-1">
              {topTypes.map(([type, count]) => (
                <span key={type} className="text-xs bg-muted rounded-full px-2 py-0.5 capitalize">
                  {TYPE_EMOJI[type] || '💪'} {type} ×{count}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
