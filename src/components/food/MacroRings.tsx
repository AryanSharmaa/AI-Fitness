'use client'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Pencil, Check } from 'lucide-react'
import { toast } from 'sonner'

interface Goals {
  proteinGoal: number
  carbsGoal: number
  fatGoal: number
  calorieGoal: number
}

interface Props {
  protein: number
  carbs: number
  fat: number
}

const RADIUS = 28
const CIRC = 2 * Math.PI * RADIUS

function Ring({ value, goal, color, label }: { value: number; goal: number; color: string; label: string }) {
  const pct = Math.min(1, goal > 0 ? value / goal : 0)
  const offset = CIRC * (1 - pct)
  const over = value > goal
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={RADIUS} fill="none" stroke="currentColor" strokeWidth="6"
          className="text-muted-foreground/15" />
        <circle cx="36" cy="36" r={RADIUS} fill="none" stroke={over ? '#f97316' : color}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.4s ease' }}
        />
        <text x="36" y="38" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">
          {Math.round(value)}
        </text>
      </svg>
      <div className="text-center">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[10px] text-muted-foreground">/ {goal}g</p>
      </div>
    </div>
  )
}

export default function MacroRings({ protein, carbs, fat }: Props) {
  const [goals, setGoals] = useState<Goals | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ proteinGoal: '', carbsGoal: '', fatGoal: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/nutrition-goals')
      .then(r => r.json())
      .then(data => {
        setGoals(data)
        setForm({ proteinGoal: String(data.proteinGoal), carbsGoal: String(data.carbsGoal), fatGoal: String(data.fatGoal) })
      })
  }, [])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/nutrition-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setGoals(g => g ? { ...g, ...data } : g)
      setEditing(false)
      toast.success('Goals updated')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!goals) return <div className="h-24 bg-muted animate-pulse rounded-lg" />

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Today's Macros</p>
        <button onClick={() => setEditing(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex justify-around">
        <Ring value={protein} goal={goals.proteinGoal} color="#3b82f6" label="Protein" />
        <Ring value={carbs} goal={goals.carbsGoal} color="#f59e0b" label="Carbs" />
        <Ring value={fat} goal={goals.fatGoal} color="#f97316" label="Fat" />
      </div>

      {editing && (
        <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
          <p className="text-xs font-medium">Set daily goals (grams)</p>
          <div className="grid grid-cols-3 gap-2">
            {(['proteinGoal', 'carbsGoal', 'fatGoal'] as const).map((key, i) => (
              <div key={key}>
                <label className="text-[10px] text-muted-foreground block mb-1">
                  {['Protein', 'Carbs', 'Fat'][i]}
                </label>
                <Input
                  type="number"
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving} className="flex-1 h-8">
              <Check className="h-3.5 w-3.5 mr-1" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="h-8">Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}
