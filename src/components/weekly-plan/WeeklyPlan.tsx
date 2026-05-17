'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, RefreshCw, Lock, Utensils, Dumbbell, Sparkles } from 'lucide-react'

interface DayPlan {
  day: string
  workout: string
  meals: { breakfast: string; lunch: string; dinner: string; snack: string }
}

interface WeeklyPlanData {
  generatedAt: string
  summary?: string
  days: DayPlan[]
  note?: string
}

const DAYS_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
}

const TODAY = new Date().toLocaleDateString('en-US', { weekday: 'long' })

export default function WeeklyPlan() {
  const [data, setData] = useState<WeeklyPlanData | null>(null)
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free')
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [activeDay, setActiveDay] = useState(TODAY)

  async function fetchPlan(regenerate = false) {
    if (regenerate) setRegenerating(true)
    else setLoading(true)
    try {
      const res = await fetch(`/api/weekly-plan${regenerate ? '?regenerate=1' : ''}`)
      const json = await res.json()
      setData(json.weeklyPlan)
      setUserPlan(json.plan)
    } finally {
      setLoading(false)
      setRegenerating(false)
    }
  }

  useEffect(() => { fetchPlan() }, [])

  const activeplan = data?.days.find(d => d.day === activeDay) ?? data?.days[0]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-emerald-500" />
            Weekly Plan
          </CardTitle>
          {userPlan === 'pro' && (
            <button
              onClick={() => fetchPlan(true)}
              disabled={regenerating}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Generating...' : 'Regenerate'}
            </button>
          )}
        </div>
        {userPlan === 'pro' && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
            <Sparkles className="h-3 w-3 text-violet-400" />
            Personalized based on your logs & goals
          </p>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-9 flex-1 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
            <div className="h-40 rounded-xl bg-muted animate-pulse" />
          </div>
        ) : !data ? (
          <p className="text-sm text-muted-foreground text-center py-8">Failed to load plan.</p>
        ) : (
          <div className="space-y-4">
            {/* AI summary for Pro */}
            {userPlan === 'pro' && data.summary && (
              <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 px-3 py-2">
                <p className="text-xs text-violet-700 dark:text-violet-300">{data.summary}</p>
              </div>
            )}

            {/* Day tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {data.days.map(d => (
                <button
                  key={d.day}
                  onClick={() => setActiveDay(d.day)}
                  className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeDay === d.day
                      ? 'bg-emerald-500 text-white'
                      : d.day === TODAY
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {DAYS_SHORT[d.day] ?? d.day}
                  {d.day === TODAY && activeDay !== d.day && (
                    <span className="ml-1 h-1 w-1 rounded-full bg-emerald-500 inline-block align-middle" />
                  )}
                </button>
              ))}
            </div>

            {/* Day detail */}
            {activeplan && (
              <div className="space-y-3">
                <div className="rounded-xl border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Dumbbell className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Workout</span>
                  </div>
                  <p className="text-sm">{activeplan.workout}</p>
                </div>

                <div className="rounded-xl border p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Utensils className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                    <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">Meals</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(meal => (
                      <div key={meal} className="bg-muted/50 rounded-lg px-2.5 py-2">
                        <p className="text-[10px] font-medium text-muted-foreground capitalize mb-0.5">{meal}</p>
                        <p className="text-xs">{activeplan.meals[meal]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Free upsell */}
            {userPlan === 'free' && (
              <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Lock className="h-3.5 w-3.5 text-violet-500" />
                  <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                    Pro: AI-personalized plan based on your data
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Tailored to your goal, schedule, food habits & recent activity
                </p>
                <a
                  href="/upgrade"
                  className="inline-block text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1 rounded-full transition-colors"
                >
                  Upgrade — ₹499/mo
                </a>
              </div>
            )}

            {data.generatedAt && (
              <p className="text-[10px] text-muted-foreground text-right">
                {userPlan === 'pro' ? `Generated ${new Date(data.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'General template'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
