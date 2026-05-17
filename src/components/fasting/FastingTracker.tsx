'use client'
import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Timer, Play, Square, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface FastingLog {
  id: string
  startTime: string
  endTime?: string | null
  targetHours: number
  completed: boolean
}

const PRESETS = [
  { label: '12:12', hours: 12, desc: 'Beginner' },
  { label: '16:8', hours: 16, desc: 'Popular' },
  { label: '18:6', hours: 18, desc: 'Intermediate' },
  { label: '20:4', hours: 20, desc: 'Advanced' },
  { label: 'OMAD', hours: 23, desc: 'One meal' },
]

function formatDuration(ms: number) {
  const totalSecs = Math.floor(ms / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FastingTracker() {
  const [active, setActive] = useState<FastingLog | null>(null)
  const [recent, setRecent] = useState<FastingLog[]>([])
  const [targetHours, setTargetHours] = useState(16)
  const [elapsed, setElapsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/fasting').then(r => r.json()).then(d => {
      setActive(d.active)
      setRecent(d.recent || [])
      if (d.active) {
        setElapsed(Date.now() - new Date(d.active.startTime).getTime())
      }
      setLoading(false)
    })
  }, [])

  // Live timer
  useEffect(() => {
    if (active) {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - new Date(active.startTime).getTime())
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [active])

  async function startFast() {
    setActing(true)
    try {
      const res = await fetch('/api/fasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', targetHours }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error()
      setActive(data.log)
      setElapsed(0)
      toast.success(`${targetHours}h fast started!`)
    } catch {
      toast.error('Failed to start fast')
    } finally {
      setActing(false)
    }
  }

  async function endFast() {
    setActing(true)
    try {
      const res = await fetch('/api/fasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error()
      if (data.completed) {
        toast.success(`Fast complete! ${data.hoursElapsed}h 🎉`)
      } else {
        toast.info(`Fast ended at ${data.hoursElapsed}h (target was ${active?.targetHours}h)`)
      }
      setActive(null)
      setElapsed(0)
      setRecent(prev => [data.log, ...prev].slice(0, 7))
    } catch {
      toast.error('Failed to end fast')
    } finally {
      setActing(false)
    }
  }

  if (loading) return <div className="h-36 bg-muted animate-pulse rounded-xl" />

  const targetMs = (active?.targetHours || targetHours) * 60 * 60 * 1000
  const progress = Math.min(elapsed / targetMs, 1)
  const pct = Math.round(progress * 100)
  const remaining = Math.max(0, targetMs - elapsed)
  const r = 54
  const circ = 2 * Math.PI * r

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Timer className="h-4 w-4 text-purple-500" />
          Intermittent Fasting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {active ? (
          /* Active fast */
          <div className="flex flex-col items-center gap-4">
            {/* Ring timer */}
            <div className="relative">
              <svg width="132" height="132" className="-rotate-90">
                <circle cx="66" cy="66" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                <circle
                  cx="66" cy="66" r={r} fill="none"
                  stroke={progress >= 1 ? '#10b981' : '#a855f7'}
                  strokeWidth="10"
                  strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
                  strokeLinecap="round" className="transition-all"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-mono">{formatDuration(elapsed)}</span>
                <span className="text-xs text-muted-foreground">{pct}% complete</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm font-medium">{active.targetHours}h fast in progress</p>
              {remaining > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {formatDuration(remaining)} remaining
                </p>
              ) : (
                <p className="text-xs text-emerald-500 font-medium">Target reached! 🎉</p>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={endFast}
              disabled={acting}
            >
              <Square className="h-4 w-4 mr-2" />
              {acting ? 'Ending...' : 'End Fast'}
            </Button>
          </div>
        ) : (
          /* Start a fast */
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Choose your fasting window</p>
            <div className="grid grid-cols-5 gap-1.5">
              {PRESETS.map(p => (
                <button
                  key={p.hours}
                  onClick={() => setTargetHours(p.hours)}
                  className={`flex flex-col items-center py-2.5 rounded-xl border text-center transition-all ${
                    targetHours === p.hours
                      ? 'border-purple-400 bg-purple-50 dark:bg-purple-950/30'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="text-sm font-bold">{p.label}</span>
                  <span className="text-[10px] text-muted-foreground">{p.desc}</span>
                </button>
              ))}
            </div>

            <Button onClick={startFast} disabled={acting} className="w-full bg-purple-600 hover:bg-purple-700">
              <Play className="h-4 w-4 mr-2" />
              {acting ? 'Starting...' : `Start ${targetHours}h Fast`}
            </Button>
          </div>
        )}

        {/* Recent history */}
        {recent.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t">
            <p className="text-xs text-muted-foreground font-medium">Recent</p>
            {recent.slice(0, 4).map(f => {
              const duration = f.endTime
                ? (new Date(f.endTime).getTime() - new Date(f.startTime).getTime()) / (1000 * 60 * 60)
                : 0
              return (
                <div key={f.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {f.completed
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      : <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    }
                    <span className="text-muted-foreground">
                      {new Date(f.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <span className={f.completed ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>
                    {duration.toFixed(1)}h / {f.targetHours}h
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
