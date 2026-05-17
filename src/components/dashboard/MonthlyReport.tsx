'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CalendarDays, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface Report {
  monthLabel: string
  workoutsCompleted: number
  workoutsSkipped: number
  completionRate: number
  daysWithFood: number
  avgDailyCalories: number
  totalProtein: number
  bestStreak: number
  currentStreak: number
  topWorkoutType: string
  highlight: string
  hasData: boolean
}

export default function MonthlyReport() {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/monthly-report')
      .then(r => r.json())
      .then(setReport)
      .finally(() => setLoading(false))
  }, [])

  async function copyReport() {
    if (!report) return
    const text = `FitMind AI — ${report.monthLabel}\n💪 ${report.workoutsCompleted} workouts · ${report.completionRate}% completion\n🍱 ${report.daysWithFood} days tracked · ${report.avgDailyCalories} avg kcal\n🔥 Best streak: ${report.bestStreak} days\n${report.highlight}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="h-36 bg-muted animate-pulse rounded-xl" />
  if (!report?.hasData) return null

  const rateColor = report.completionRate >= 70 ? 'text-emerald-600' : report.completionRate >= 40 ? 'text-amber-500' : 'text-red-500'

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-emerald-500" />
            {report.monthLabel} in Review
          </CardTitle>
          <button onClick={copyReport} className="text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Workout completion</p>
          <p className={`text-2xl font-bold ${rateColor}`}>{report.completionRate}%</p>
        </div>
        <Progress value={report.completionRate} className="h-2" />

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-lg font-bold">{report.workoutsCompleted}</p>
            <p className="text-[11px] text-muted-foreground">Workouts</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-lg font-bold">{report.daysWithFood}</p>
            <p className="text-[11px] text-muted-foreground">Days tracked</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-lg font-bold">{report.avgDailyCalories > 0 ? `${(report.avgDailyCalories / 1000).toFixed(1)}k` : '—'}</p>
            <p className="text-[11px] text-muted-foreground">Avg kcal/day</p>
          </div>
        </div>

        {report.bestStreak > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <span className="text-sm">Best streak: <strong>{report.bestStreak} days</strong></span>
            {report.topWorkoutType && (
              <span className="text-xs text-muted-foreground ml-auto capitalize">Top: {report.topWorkoutType}</span>
            )}
          </div>
        )}

        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground leading-relaxed">{report.highlight}</p>
        </div>
      </CardContent>
    </Card>
  )
}
