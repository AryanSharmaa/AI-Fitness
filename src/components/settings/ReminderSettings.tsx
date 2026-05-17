'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'

export default function ReminderSettings() {
  const [enabled, setEnabled] = useState(false)
  const [time, setTime] = useState('08:00')
  const [type, setType] = useState('daily')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/reminders')
      .then(r => r.json())
      .then(d => {
        setEnabled(d.reminderEnabled)
        setTime(d.reminderTime || '08:00')
        setType(d.reminderType || 'daily')
        setLoaded(true)
      })
  }, [])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderEnabled: enabled, reminderTime: time, reminderType: type }),
      })
      if (!res.ok) throw new Error()
      toast.success('Reminder settings saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Email Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Daily workout reminder</p>
            <p className="text-xs text-muted-foreground">Get an email if you haven't logged a workout</p>
          </div>
          <button
            onClick={() => setEnabled(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {enabled && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Reminder time</label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Reminder type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="daily">Daily reminder</option>
                  <option value="streak_only">Streak at risk only</option>
                </select>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Add <code className="bg-muted px-1 rounded">RESEND_API_KEY</code> to your Render env vars to activate sending.
            </p>
          </div>
        )}

        <Button onClick={save} disabled={saving} size="sm">
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </CardContent>
    </Card>
  )
}
