'use client'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, Trash2, Dumbbell } from 'lucide-react'
import { toast } from 'sonner'

interface WorkoutLog {
  id: string
  type: string
  duration?: number
  completed: boolean
  skipped: boolean
  skipReason?: string
  notes?: string
  date: string
  exercises?: any[]
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const TYPE_COLORS: Record<string, string> = {
  strength: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  hiit: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  cardio: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  yoga: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  recovery: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  minimal: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export default function WorkoutHistory() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const monthStr = `${year}-${String(month).padStart(2, '0')}`

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/workout/history?month=${monthStr}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setTotal(data.total)
      }
    } finally {
      setLoading(false)
    }
  }, [monthStr])

  useEffect(() => { load() }, [load])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    const n = new Date(); if (year > n.getFullYear() || (year === n.getFullYear() && month >= n.getMonth() + 1)) return
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  async function deleteLog(id: string) {
    setDeleting(id)
    try {
      const res = await fetch('/api/workout/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      setLogs(prev => prev.filter(l => l.id !== id))
      setTotal(t => t - 1)
      toast.success('Entry deleted')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const completed = logs.filter(l => l.completed).length
  const skipped = logs.filter(l => l.skipped).length

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="font-semibold">{MONTHS[month - 1]} {year}</p>
          <p className="text-xs text-muted-foreground">{total} sessions</p>
        </div>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-30"
          disabled={year === now.getFullYear() && month >= now.getMonth() + 1}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Stats */}
      {!loading && logs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
            <p className="text-xl font-bold text-emerald-600">{completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="rounded-xl border bg-red-50 dark:bg-red-950/30 p-3 text-center">
            <p className="text-xl font-bold text-red-500">{skipped}</p>
            <p className="text-xs text-muted-foreground">Skipped</p>
          </div>
          <div className="rounded-xl border p-3 text-center">
            <p className="text-xl font-bold">{total > 0 ? Math.round(completed / total * 100) : 0}%</p>
            <p className="text-xs text-muted-foreground">Completion</p>
          </div>
        </div>
      )}

      {/* Logs */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No workouts logged in {MONTHS[month - 1]}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => {
            const exercises = Array.isArray(log.exercises) ? log.exercises as any[] : []
            return (
              <Card key={log.id}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                        log.completed ? 'bg-emerald-500' : 'bg-red-100 dark:bg-red-900/40'
                      }`}>
                        {log.completed
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          : <XCircle className="h-3.5 w-3.5 text-red-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[log.type] || TYPE_COLORS.minimal}`}>
                            {log.type}
                          </span>
                          {log.duration && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />{log.duration} min
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        {log.skipped && log.skipReason && (
                          <p className="text-xs text-muted-foreground mt-1">Skipped: {log.skipReason}</p>
                        )}
                        {exercises.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {exercises.slice(0, 3).map((e: any) => e.name).join(', ')}
                            {exercises.length > 3 && ` +${exercises.length - 3} more`}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteLog(log.id)}
                      disabled={deleting === log.id}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
