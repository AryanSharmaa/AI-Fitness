'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const MOOD_OPTIONS = [
  { value: 1, emoji: '😞', label: 'Bad' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '🤩', label: 'Great' },
]

const ENERGY_OPTIONS = [
  { value: 1, emoji: '🪫', label: 'Drained' },
  { value: 2, emoji: '😴', label: 'Tired' },
  { value: 3, emoji: '🙂', label: 'Okay' },
  { value: 4, emoji: '⚡', label: 'Energised' },
  { value: 5, emoji: '🚀', label: 'Pumped' },
]

interface MoodLog {
  mood: number
  energy: number
  notes?: string | null
}

export default function MoodCheckIn() {
  const [todayLog, setTodayLog] = useState<MoodLog | null>(null)
  const [mood, setMood] = useState(0)
  const [energy, setEnergy] = useState(0)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/mood').then(r => r.json()).then(d => {
      if (d.todayLog) {
        setTodayLog(d.todayLog)
        setMood(d.todayLog.mood)
        setEnergy(d.todayLog.energy)
        setDone(true)
      }
    })
  }, [])

  async function save() {
    if (!mood || !energy) { toast.error('Pick both mood and energy'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, energy }),
      })
      if (!res.ok) throw new Error()
      setDone(true)
      toast.success('Check-in saved!')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    const m = MOOD_OPTIONS.find(o => o.value === mood)
    const e = ENERGY_OPTIONS.find(o => o.value === energy)
    return (
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{m?.emoji}</span>
              <div>
                <p className="text-sm font-medium">Today's check-in</p>
                <p className="text-xs text-muted-foreground">
                  Mood: {m?.label} · Energy: {e?.label}
                </p>
              </div>
            </div>
            <button
              onClick={() => setDone(false)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Update
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardContent className="pt-4 space-y-4">
        <p className="text-sm font-medium">How are you feeling today?</p>

        {/* Mood row */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Mood</p>
          <div className="flex gap-2">
            {MOOD_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => setMood(o.value)}
                className={`flex-1 flex flex-col items-center py-2 rounded-xl border transition-all ${
                  mood === o.value
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/40 scale-105'
                    : 'hover:bg-muted'
                }`}
              >
                <span className="text-xl">{o.emoji}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{o.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy row */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Energy</p>
          <div className="flex gap-2">
            {ENERGY_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => setEnergy(o.value)}
                className={`flex-1 flex flex-col items-center py-2 rounded-xl border transition-all ${
                  energy === o.value
                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/40 scale-105'
                    : 'hover:bg-muted'
                }`}
              >
                <span className="text-xl">{o.emoji}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{o.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={save} disabled={saving || !mood || !energy} size="sm" className="w-full">
          {saving ? 'Saving...' : 'Save Check-in'}
        </Button>
      </CardContent>
    </Card>
  )
}
