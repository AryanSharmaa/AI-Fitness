'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Scale, Lock, TrendingDown, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface BodyLog {
  id: string
  date: string
  weight?: number
  waist?: number
  chest?: number
  arms?: number
  hips?: number
}

export default function BodyTracker() {
  const [logs, setLogs] = useState<BodyLog[]>([])
  const [plan, setPlan] = useState<'free' | 'pro'>('free')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ weight: '', waist: '', chest: '', arms: '', hips: '' })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const res = await fetch('/api/body')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setPlan(data.plan)
      }
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    if (!form.weight && !form.waist && !form.chest && !form.arms && !form.hips) {
      toast.error('Enter at least one measurement')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Logged!')
      setForm({ weight: '', waist: '', chest: '', arms: '', hips: '' })
      setShowForm(false)
      load()
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const latest = logs[logs.length - 1]
  const first = logs[0]
  const weightChange = latest?.weight && first?.weight && logs.length > 1
    ? (latest.weight - first.weight).toFixed(1)
    : null

  const chartData = logs
    .filter(l => l.weight)
    .map(l => ({
      date: new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      weight: l.weight,
    }))

  if (loading) return <div className="h-40 bg-muted animate-pulse rounded-xl" />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-purple-500" />
              Body Tracker
            </CardTitle>
            <div className="flex items-center gap-2">
              {plan === 'pro'
                ? <Badge className="bg-emerald-500 text-white text-xs">Pro</Badge>
                : <Badge variant="outline" className="text-xs">Free</Badge>
              }
              <button
                onClick={() => setShowForm(v => !v)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Log
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Current stats */}
          {latest ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {latest.weight ?? '—'}<span className="text-sm font-normal"> kg</span>
                </p>
                <p className="text-xs text-muted-foreground">Current weight</p>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                {weightChange !== null ? (
                  <>
                    <p className={`text-2xl font-bold ${parseFloat(weightChange) < 0 ? 'text-emerald-600' : 'text-orange-500'}`}>
                      {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange}<span className="text-sm font-normal"> kg</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Since first log</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-muted-foreground">—</p>
                    <p className="text-xs text-muted-foreground">Log more to see change</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Scale className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No logs yet. Hit Log to start tracking.</p>
            </div>
          )}

          {/* Log form */}
          {showForm && (
            <div className="border rounded-xl p-4 space-y-3 bg-muted/30">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Weight (kg)</label>
                  <Input
                    type="number"
                    placeholder="72.5"
                    value={form.weight}
                    onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                    step="0.1"
                  />
                </div>
                {plan === 'pro' && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Waist (cm)</label>
                      <Input type="number" placeholder="80" value={form.waist}
                        onChange={e => setForm(f => ({ ...f, waist: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Chest (cm)</label>
                      <Input type="number" placeholder="95" value={form.chest}
                        onChange={e => setForm(f => ({ ...f, chest: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Arms (cm)</label>
                      <Input type="number" placeholder="35" value={form.arms}
                        onChange={e => setForm(f => ({ ...f, arms: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Hips (cm)</label>
                      <Input type="number" placeholder="90" value={form.hips}
                        onChange={e => setForm(f => ({ ...f, hips: e.target.value }))} />
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={save} disabled={saving} className="flex-1" size="sm">
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pro: weight trend chart */}
      {plan === 'pro' && chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-purple-500" />
              Weight Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip formatter={(v) => [`${v} kg`, 'Weight']} />
                <Area type="monotone" dataKey="weight" stroke="#a855f7" fill="url(#weightGrad)" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Pro: measurements history */}
      {plan === 'pro' && logs.some(l => l.waist || l.chest || l.arms || l.hips) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Measurements (latest)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'Waist', value: latest?.waist, unit: 'cm' },
                { label: 'Chest', value: latest?.chest, unit: 'cm' },
                { label: 'Arms', value: latest?.arms, unit: 'cm' },
                { label: 'Hips', value: latest?.hips, unit: 'cm' },
              ].map(m => (
                <div key={m.label} className="bg-muted rounded-lg p-2">
                  <p className="text-sm font-bold">{m.value ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Free upsell */}
      {plan === 'free' && (
        <Card className="border-dashed border-purple-300 bg-purple-50/50 dark:bg-purple-950/10">
          <CardContent className="pt-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Lock className="h-3.5 w-3.5 text-purple-500" />
                <p className="text-sm font-medium">Pro: trend chart + body measurements</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Track waist, chest, arms, hips + 30-day weight graph.
              </p>
            </div>
            <Button size="sm" asChild className="shrink-0 bg-purple-600 hover:bg-purple-700">
              <Link href="/upgrade">Upgrade</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
