'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Flame, Footprints, Clock, Plus, ArrowUpRight, Dumbbell, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
const RecoveryCard = dynamic(() => import('./RecoveryCard'), { ssr: false, loading: () => null })
const MoodCheckIn = dynamic(() => import('./MoodCheckIn'), { ssr: false, loading: () => null })
const InsightsFeed = dynamic(() => import('./InsightsFeed'), { ssr: false, loading: () => null })
const MilestoneCelebration = dynamic(() => import('./MilestoneCelebration'), { ssr: false, loading: () => null })

interface DashboardData {
  name: string
  streak: number
  todaySteps: number
  todayCaloriesBurned: number
  todayActiveMinutes: number
  todayCaloriesConsumed: number
  calorieGoal: number
  waterMl: number
  waterGoalMl: number
  protein: number
  carbs: number
  fat: number
  proteinGoal: number
  carbsGoal: number
  fatGoal: number
  activities: {
    id: string
    name: string
    type: string
    duration: number
    caloriesBurned: number
    exerciseCount: number
    distance?: number | null
    steps?: number | null
  }[]
  feed: {
    id: string
    type: string
    duration: number
    caloriesBurned: number
    exerciseCount: number
    distance?: number | null
    steps?: number | null
    date: string
  }[]
}

const TABS = ['Today', 'Feed', 'Nutrition', 'Trends'] as const
type Tab = typeof TABS[number]

const WORKOUT_ICON: Record<string, string> = {
  run: '🏃', cardio: '🏃', walk: '🚶', cycling: '🚴',
  strength: '🏋️', hiit: '⚡', yoga: '🧘', swimming: '🏊', general: '💪',
}

function DonutRing({ pct, size = 80, stroke = 10, color = '#f97316' }: {
  pct: number; size?: number; stroke?: number; color?: string
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(pct, 1))
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-700"
      />
    </svg>
  )
}

function MacroBar({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label} {current}/{goal}g</span>
        <span className="text-muted-foreground">{Math.round(pct * 100)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
    </div>
  )
}

export default function DashboardHome() {
  const [tab, setTab] = useState<Tab>('Today')
  const [data, setData] = useState<DashboardData | null>(null)
  const [addingWater, setAddingWater] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/today').then(r => r.json()).then(setData)
  }, [])

  async function addWater() {
    setAddingWater(true)
    try {
      await fetch('/api/water', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 250 }) })
      setData(prev => prev ? { ...prev, waterMl: prev.waterMl + 250 } : prev)
    } catch {
      toast.error('Failed to log water')
    } finally {
      setAddingWater(false)
    }
  }

  const firstName = data?.name?.split(' ')[0] || 'there'

  function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
    <MilestoneCelebration />
    <div className="max-w-2xl mx-auto px-4 pb-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <p className="text-lg font-bold text-foreground">FitMind AI</p>
          <p className="text-xs text-muted-foreground">{dateStr}</p>
        </div>
        {data && data.streak > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full text-sm font-semibold">
            🔥 {data.streak}-day streak
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 bg-muted rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* TODAY TAB */}
      {tab === 'Today' && (
        <div className="space-y-4">
          {/* Hero card */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white">
            <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-white/10 -translate-y-10 translate-x-10" />
            <div className="absolute right-8 bottom-0 w-24 h-24 rounded-full bg-white/10 translate-y-8" />
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{getGreeting()}</p>
            <h2 className="text-2xl font-bold mt-0.5">{firstName}'s Dashboard</h2>
            <div className="flex gap-6 mt-4">
              <div>
                <p className="text-2xl font-bold">{data?.todaySteps ? data.todaySteps.toLocaleString() : '—'}</p>
                <p className="text-xs opacity-80 flex items-center gap-1"><Footprints className="h-3 w-3" />Steps</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{data?.todayCaloriesBurned || '—'}</p>
                <p className="text-xs opacity-80 flex items-center gap-1"><Flame className="h-3 w-3" />kcal burnt</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{data?.todayActiveMinutes ? `${data.todayActiveMinutes}m` : '—'}</p>
                <p className="text-xs opacity-80 flex items-center gap-1"><Clock className="h-3 w-3" />Active</p>
              </div>
            </div>
          </div>

          {/* Calories + Water row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Calories donut */}
            <div className="rounded-2xl bg-card border p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Calories</p>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <DonutRing
                    pct={data ? data.todayCaloriesConsumed / data.calorieGoal : 0}
                    size={72} stroke={8}
                    color={data && data.todayCaloriesConsumed > data.calorieGoal ? '#ef4444' : '#f97316'}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold">
                      {data ? Math.round(data.todayCaloriesConsumed / data.calorieGoal * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold">{data?.todayCaloriesConsumed.toLocaleString() || 0}<span className="text-sm font-normal text-muted-foreground ml-0.5">kcal</span></p>
                  <p className="text-xs text-muted-foreground">of {data?.calorieGoal.toLocaleString() || 2000} goal</p>
                </div>
              </div>
            </div>

            {/* Water */}
            <div className="rounded-2xl bg-card border p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Water</p>
              <p className="text-2xl font-bold">{data ? (data.waterMl / 1000).toFixed(1) : '0'}<span className="text-sm font-normal text-muted-foreground">L</span></p>
              <p className="text-xs text-muted-foreground">of {data ? (data.waterGoalMl / 1000).toFixed(1) : 2.5}L goal</p>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${data ? Math.min(data.waterMl / data.waterGoalMl * 100, 100) : 0}%` }}
                />
              </div>
              <button
                onClick={addWater}
                disabled={addingWater}
                className="w-full mt-1 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted transition-colors"
              >
                + 250ml
              </button>
            </div>
          </div>

          {/* Macros today */}
          <div className="rounded-2xl bg-card border p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Macros Today</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-muted/50 py-2">
                <p className="text-base font-bold text-red-500">{data?.protein || 0}g</p>
                <p className="text-[11px] text-muted-foreground">Protein</p>
              </div>
              <div className="rounded-xl bg-muted/50 py-2">
                <p className="text-base font-bold text-blue-500">{data?.carbs || 0}g</p>
                <p className="text-[11px] text-muted-foreground">Carbs</p>
              </div>
              <div className="rounded-xl bg-muted/50 py-2">
                <p className="text-base font-bold text-yellow-500">{data?.fat || 0}g</p>
                <p className="text-[11px] text-muted-foreground">Fat</p>
              </div>
            </div>
            <div className="space-y-2.5">
              <MacroBar label="Protein" current={data?.protein || 0} goal={data?.proteinGoal || 120} color="#ef4444" />
              <MacroBar label="Carbs" current={data?.carbs || 0} goal={data?.carbsGoal || 250} color="#3b82f6" />
              <MacroBar label="Fat" current={data?.fat || 0} goal={data?.fatGoal || 65} color="#eab308" />
            </div>
          </div>

          <MoodCheckIn />
          <RecoveryCard />
          <InsightsFeed />

          {/* Today's Activity */}
          <div className="rounded-2xl bg-card border p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Today's Activity</p>
            {!data || data.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No workouts logged today yet.</p>
            ) : (
              <div className="space-y-3">
                {data.activities.map(a => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-lg shrink-0">
                      {WORKOUT_ICON[a.type] || '💪'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.distance ? `${a.distance} km · ` : ''}
                        {a.duration} min
                        {a.exerciseCount > 0 ? ` · ${a.exerciseCount} exercises` : ''}
                      </p>
                    </div>
                    {a.caloriesBurned > 0 && (
                      <p className="text-sm font-semibold text-orange-500 shrink-0">{a.caloriesBurned} kcal</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <Link href="/workout" className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border text-sm text-muted-foreground hover:bg-muted transition-colors mt-1">
              <Plus className="h-4 w-4" />Log workout
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* FEED TAB */}
      {tab === 'Feed' && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Last 7 days</p>
          {!data || data.feed.length === 0 ? (
            <div className="rounded-2xl bg-card border p-8 text-center text-muted-foreground">
              <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No recent workouts. <Link href="/workout" className="text-orange-500 underline">Log one</Link></p>
            </div>
          ) : (
            data.feed.map(f => (
              <div key={f.id} className="rounded-2xl bg-card border p-4 flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-xl shrink-0">
                  {WORKOUT_ICON[f.type] || '💪'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold capitalize">{f.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.distance ? `${f.distance} km · ` : ''}
                    {f.duration} min
                    {f.exerciseCount > 0 ? ` · ${f.exerciseCount} exercises` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(f.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
                {f.caloriesBurned > 0 && (
                  <p className="text-sm font-bold text-orange-500 shrink-0">{f.caloriesBurned} kcal</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* NUTRITION TAB */}
      {tab === 'Nutrition' && (
        <div className="space-y-4">
          {/* Calorie summary */}
          <div className="rounded-2xl bg-card border p-5 flex items-center gap-5">
            <div className="relative shrink-0">
              <DonutRing
                pct={data ? data.todayCaloriesConsumed / data.calorieGoal : 0}
                size={100} stroke={12}
                color={data && data.todayCaloriesConsumed > data.calorieGoal ? '#ef4444' : '#f97316'}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold">{data ? Math.round(data.todayCaloriesConsumed / data.calorieGoal * 100) : 0}%</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.todayCaloriesConsumed.toLocaleString() || 0} <span className="text-base font-normal text-muted-foreground">kcal</span></p>
              <p className="text-sm text-muted-foreground">of {data?.calorieGoal.toLocaleString()} daily goal</p>
              <p className="text-sm font-medium mt-1">
                {data && data.calorieGoal - data.todayCaloriesConsumed > 0
                  ? <span className="text-emerald-500">{(data.calorieGoal - data.todayCaloriesConsumed).toLocaleString()} kcal remaining</span>
                  : <span className="text-red-500">Goal exceeded</span>
                }
              </p>
            </div>
          </div>

          {/* Macro breakdown */}
          <div className="rounded-2xl bg-card border p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Macro Breakdown</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Protein', value: data?.protein || 0, goal: data?.proteinGoal || 120, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
                { label: 'Carbs', value: data?.carbs || 0, goal: data?.carbsGoal || 250, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                { label: 'Fat', value: data?.fat || 0, goal: data?.fatGoal || 65, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
              ].map(m => (
                <div key={m.label} className={`rounded-xl ${m.bg} p-3`}>
                  <p className={`text-xl font-bold ${m.color}`}>{m.value}g</p>
                  <p className="text-[11px] text-muted-foreground">{m.label}</p>
                  <p className="text-[11px] text-muted-foreground">/{m.goal}g</p>
                </div>
              ))}
            </div>
            <div className="space-y-3 pt-1">
              <MacroBar label="Protein" current={data?.protein || 0} goal={data?.proteinGoal || 120} color="#ef4444" />
              <MacroBar label="Carbs" current={data?.carbs || 0} goal={data?.carbsGoal || 250} color="#3b82f6" />
              <MacroBar label="Fat" current={data?.fat || 0} goal={data?.fatGoal || 65} color="#eab308" />
            </div>
          </div>

          {/* Quick log CTA */}
          <Link href="/food-log">
            <div className="rounded-2xl bg-orange-500 hover:bg-orange-600 transition-colors p-4 text-white flex items-center justify-between">
              <div>
                <p className="font-semibold">Log a meal</p>
                <p className="text-xs opacity-80">Tell your AI coach what you ate</p>
              </div>
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </Link>
        </div>
      )}

      {/* TRENDS TAB */}
      {tab === 'Trends' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-card border p-5 text-center space-y-3">
            <TrendingUp className="h-10 w-10 mx-auto text-orange-400 opacity-60" />
            <p className="font-semibold">Full trends on Progress page</p>
            <p className="text-sm text-muted-foreground">Charts, heatmaps, streaks, and 30-day breakdowns</p>
            <Link href="/progress" className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
              View Progress <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          {/* Quick stats */}
          {data && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Streak', value: `${data.streak}d`, icon: '🔥', color: 'bg-orange-50 dark:bg-orange-950/30' },
                { label: 'Today Active', value: `${data.todayActiveMinutes}m`, icon: '⏱️', color: 'bg-blue-50 dark:bg-blue-950/30' },
                { label: 'Kcal Burned', value: data.todayCaloriesBurned || '—', icon: '⚡', color: 'bg-purple-50 dark:bg-purple-950/30' },
                { label: 'Water', value: `${(data.waterMl / 1000).toFixed(1)}L`, icon: '💧', color: 'bg-cyan-50 dark:bg-cyan-950/30' },
              ].map(s => (
                <div key={s.label} className={`rounded-2xl border ${s.color} p-4`}>
                  <p className="text-2xl mb-0.5">{s.icon}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  )
}
