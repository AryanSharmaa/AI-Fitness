'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Plus, Utensils, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface FoodLog {
  id: string
  meal: string
  description: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  mealType: string
  aiAnalysis?: string
  date: string
}

interface DayData {
  logs: FoodLog[]
  totals: { calories: number; protein: number; carbs: number; fat: number }
  dailyTarget: number
}

const MEAL_SUGGESTIONS: Record<string, string[]> = {
  breakfast: ['2 rotis with sabzi', '1 cup poha with peanuts', 'Idli sambhar (3 idlis)', '2 eggs with toast', 'Upma with vegetables'],
  lunch: ['2 rotis + dal + sabzi', 'Rice + dal + curd', 'Rajma rice', 'Chole roti', 'Dal khichdi'],
  dinner: ['2 rotis + sabzi + dal', 'Rice + dal + sabzi', 'Khichdi', 'Dalia with vegetables'],
  snack: ['1 banana', 'Handful of mixed nuts', 'Curd with fruits', '1 apple', 'Roasted chana'],
}

export default function FoodLogger() {
  const [data, setData] = useState<DayData | null>(null)
  const [description, setDescription] = useState('')
  const [mealType, setMealType] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { loadLogs() }, [])

  async function loadLogs() {
    try {
      const res = await fetch('/api/food')
      if (res.ok) setData(await res.json())
    } catch {}
  }

  async function logMeal() {
    if (!description.trim() || !mealType) {
      toast.error('Please fill in what you ate and the meal type')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, mealType }),
      })
      if (!res.ok) throw new Error()
      const { aiAnalysis } = await res.json()
      toast.success(aiAnalysis || 'Meal logged!')
      setDescription('')
      setMealType('')
      setShowForm(false)
      loadLogs()
    } catch {
      toast.error('Failed to log meal. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const caloriePercent = data ? Math.min(100, (data.totals.calories / data.dailyTarget) * 100) : 0

  return (
    <div className="space-y-4 max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Food Log</h1>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Log Meal
        </Button>
      </div>

      {/* Daily summary */}
      {data && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Today's Calories</span>
              <span className="font-bold">
                {Math.round(data.totals.calories)} / {data.dailyTarget} kcal
              </span>
            </div>
            <Progress value={caloriePercent} className="h-2" />
            <div className="grid grid-cols-3 gap-4 pt-1">
              <MacroChip label="Protein" value={`${Math.round(data.totals.protein)}g`} color="blue" />
              <MacroChip label="Carbs" value={`${Math.round(data.totals.carbs)}g`} color="yellow" />
              <MacroChip label="Fat" value={`${Math.round(data.totals.fat)}g`} color="orange" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log form */}
      {showForm && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Utensils className="h-4 w-4" /> What did you eat?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={mealType} onValueChange={(v) => v && setMealType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Meal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
                <SelectItem value="lunch">☀️ Lunch</SelectItem>
                <SelectItem value="dinner">🌙 Dinner</SelectItem>
                <SelectItem value="snack">🍎 Snack</SelectItem>
              </SelectContent>
            </Select>

            {mealType && (
              <div className="flex flex-wrap gap-1.5">
                {MEAL_SUGGESTIONS[mealType]?.map(s => (
                  <button
                    key={s}
                    onClick={() => setDescription(s)}
                    className="text-xs px-2 py-1 rounded-full border bg-muted hover:bg-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <Textarea
              placeholder="Describe what you had — e.g., '2 rotis with dal and sabzi, 1 glass curd'"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              No need to weigh anything. Just describe it naturally — AI handles the rest.
            </p>
            <div className="flex gap-2">
              <Button onClick={logMeal} disabled={loading} className="flex-1">
                {loading ? 'Logging...' : 'Log Meal'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's logs */}
      <div className="space-y-2">
        {data?.logs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Utensils className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No meals logged today yet.</p>
            <p className="text-xs mt-1">Tap "Log Meal" to start tracking.</p>
          </div>
        )}
        {data?.logs.map(log => (
          <FoodLogCard key={log.id} log={log} />
        ))}
      </div>
    </div>
  )
}

function FoodLogCard({ log }: { log: FoodLog }) {
  const mealEmojis: Record<string, string> = {
    breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎'
  }
  return (
    <Card>
      <CardContent className="pt-3 pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{mealEmojis[log.mealType] || '🍽️'}</span>
              <span className="text-sm font-medium capitalize">{log.mealType}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(log.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{log.description}</p>
            {log.aiAnalysis && (
              <p className="text-xs text-emerald-600 mt-1.5 leading-relaxed">{log.aiAnalysis}</p>
            )}
          </div>
          <div className="text-right ml-4 shrink-0">
            <span className="font-bold text-sm">{log.calories} kcal</span>
            <p className="text-xs text-muted-foreground">{log.protein}g protein</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MacroChip({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    orange: 'text-orange-600',
  }
  return (
    <div className="text-center">
      <p className={`font-bold text-sm ${colors[color]}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
