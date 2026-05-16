'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Droplets, Plus, Lock, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const QUICK_AMOUNTS = [150, 200, 300, 500]
const FREE_GOAL = 2000 // ml
const PRO_GOAL_DEFAULT = 2500

interface WaterLog {
  id: string
  amount: number
  date: string
}

interface WaterData {
  todayTotal: number
  logs: WaterLog[]
  plan: 'free' | 'pro'
}

export default function WaterTracker() {
  const [data, setData] = useState<WaterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const res = await fetch('/api/water')
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function addWater(amount: number) {
    setAdding(true)
    try {
      const res = await fetch('/api/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      if (!res.ok) throw new Error()
      toast.success(`+${amount}ml logged 💧`)
      load()
    } catch {
      toast.error('Failed to log water')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return <div className="h-40 bg-muted animate-pulse rounded-xl" />
  }

  const isPro = data?.plan === 'pro'
  const goal = isPro ? PRO_GOAL_DEFAULT : FREE_GOAL
  const total = data?.todayTotal ?? 0
  const percent = Math.min(100, Math.round((total / goal) * 100))
  const glasses = Math.round(total / 250)
  const goalGlasses = Math.round(goal / 250)

  // Build 7-day chart data for Pro
  const chartData = isPro ? buildChartData(data?.logs ?? []) : []

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 dark:border-blue-900">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              Water Tracker
            </CardTitle>
            {isPro
              ? <Badge className="bg-emerald-500 text-white text-xs">Pro</Badge>
              : <Badge variant="outline" className="text-xs">Free</Badge>
            }
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Today total */}
          <div className="text-center py-2">
            <p className="text-4xl font-bold text-blue-600">
              {(total / 1000).toFixed(1)}<span className="text-lg font-normal text-muted-foreground">L</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {glasses} of {goalGlasses} glasses · goal {(goal / 1000).toFixed(1)}L
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <Progress value={percent} className="h-3 [&>div]:bg-blue-500" />
            <p className="text-xs text-right text-muted-foreground">{percent}% of daily goal</p>
          </div>

          {/* Quick add buttons */}
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map(amt => (
              <button
                key={amt}
                onClick={() => addWater(amt)}
                disabled={adding}
                className="flex flex-col items-center gap-0.5 py-2 rounded-lg border bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 transition-colors disabled:opacity-50"
              >
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium">{amt}ml</span>
              </button>
            ))}
          </div>

          {/* Completion message */}
          {total >= goal && (
            <div className="text-center py-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                🎉 Daily goal reached! Great hydration today.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pro: 7-day history chart */}
      {isPro && chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              7-Day Hydration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(1)}L`} />
                <Tooltip formatter={(v) => [`${(Number(v)/1000).toFixed(2)}L`, 'Water']} />
                <Area type="monotone" dataKey="amount" stroke="#3b82f6" fill="url(#waterGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Free: upsell to Pro */}
      {!isPro && (
        <Card className="border-dashed border-blue-300 bg-blue-50/50 dark:bg-blue-950/10">
          <CardContent className="pt-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Lock className="h-3.5 w-3.5 text-blue-500" />
                <p className="text-sm font-medium">Pro: 7-day history + custom goal</p>
              </div>
              <p className="text-xs text-muted-foreground">
                See your hydration trends and set a personal daily target.
              </p>
            </div>
            <Button size="sm" asChild className="shrink-0 bg-blue-600 hover:bg-blue-700">
              <Link href="/pricing">Upgrade</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function buildChartData(logs: WaterLog[]) {
  const days: Record<string, number> = {}
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    days[key] = 0
  }
  for (const log of logs) {
    const key = new Date(log.date).toISOString().split('T')[0]
    if (key in days) days[key] += log.amount
  }
  return Object.entries(days).map(([date, amount]) => ({
    day: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
    amount,
  }))
}
