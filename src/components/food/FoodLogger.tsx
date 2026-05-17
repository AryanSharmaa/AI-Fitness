'use client'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Plus, Utensils, ChevronLeft, ChevronRight, Trash2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import MacroRings from './MacroRings'

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
  date: string
}

const QUICK_MEALS: Record<string, { label: string; desc: string }[]> = {
  breakfast: [
    { label: '2 rotis + sabzi', desc: '2 rotis with sabzi' },
    { label: 'Poha', desc: '1 cup poha with peanuts and vegetables' },
    { label: 'Idli sambhar', desc: '3 idlis with sambhar and chutney' },
    { label: '2 eggs + toast', desc: '2 scrambled eggs with 2 slices of toast' },
    { label: 'Upma', desc: '1 bowl upma with vegetables' },
    { label: 'Paratha + curd', desc: '2 parathas with curd' },
    { label: 'Dosa + chutney', desc: '2 dosas with coconut chutney' },
    { label: 'Oats + banana', desc: '1 bowl oats with banana and milk' },
  ],
  lunch: [
    { label: 'Dal chawal', desc: '1 bowl dal with 1 bowl rice' },
    { label: 'Roti dal sabzi', desc: '2 rotis with dal and sabzi' },
    { label: 'Rajma rice', desc: '1 bowl rajma with rice' },
    { label: 'Chole roti', desc: '2 rotis with chole' },
    { label: 'Paneer sabzi', desc: '1 bowl paneer sabzi with 2 rotis' },
    { label: 'Khichdi', desc: '1 bowl dal khichdi with curd' },
    { label: 'Chicken rice', desc: '1 bowl chicken curry with rice' },
    { label: 'Biryani', desc: '1 plate veg/chicken biryani with raita' },
  ],
  dinner: [
    { label: 'Dal roti', desc: '2 rotis with dal and sabzi' },
    { label: 'Sabzi roti', desc: '2 rotis with mixed vegetable sabzi' },
    { label: 'Khichdi', desc: '1 bowl moong dal khichdi' },
    { label: 'Dalia', desc: '1 bowl dalia with vegetables' },
    { label: 'Soup + roti', desc: '1 bowl vegetable soup with 1 roti' },
    { label: 'Rice dal', desc: '1 bowl rice with dal and sabzi' },
  ],
  snack: [
    { label: 'Banana', desc: '1 banana' },
    { label: 'Mixed nuts', desc: 'handful of almonds, walnuts and cashews' },
    { label: 'Curd', desc: '1 bowl curd with fruits' },
    { label: 'Apple', desc: '1 apple' },
    { label: 'Roasted chana', desc: '1 handful roasted chana' },
    { label: 'Sprouts', desc: '1 bowl mixed sprouts' },
    { label: 'Protein shake', desc: '1 scoop whey protein with milk' },
    { label: 'Peanuts', desc: '1 handful roasted peanuts' },
  ],
}

function dateStr(d: Date) { return d.toISOString().split('T')[0] }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }

export default function FoodLogger() {
  const [selectedDate, setSelectedDate] = useState(() => dateStr(new Date()))
  const [data, setData] = useState<DayData | null>(null)
  const [description, setDescription] = useState('')
  const [mealType, setMealType] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadLogs = useCallback(async (date: string) => {
    setPageLoading(true)
    try {
      const res = await fetch(`/api/food/history?date=${date}`)
      if (res.ok) setData(await res.json())
    } finally {
      setPageLoading(false)
    }
  }, [])

  useEffect(() => { loadLogs(selectedDate) }, [selectedDate, loadLogs])

  function goDay(delta: number) {
    const d = addDays(new Date(selectedDate), delta)
    if (d > new Date()) return
    setSelectedDate(dateStr(d))
  }

  const isToday = selectedDate === dateStr(new Date())

  async function logMeal() {
    if (!description.trim() || !mealType) {
      toast.error('Select meal type and describe what you ate')
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
      loadLogs(selectedDate)
    } catch {
      toast.error('Failed to log meal. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function deleteLog(id: string) {
    setDeleting(id)
    try {
      const res = await fetch('/api/food/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      toast.success('Entry removed')
      loadLogs(selectedDate)
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const caloriePercent = data ? Math.min(100, (data.totals.calories / data.dailyTarget) * 100) : 0
  const displayDate = new Date(selectedDate + 'T12:00:00')

  return (
    <div className="space-y-4 max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Food Log</h1>
        {isToday && (
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Log Meal
          </Button>
        )}
      </div>

      {/* Date nav */}
      <div className="flex items-center justify-between bg-muted/40 rounded-xl px-4 py-2">
        <button onClick={() => goDay(-1)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-medium">
            {isToday ? 'Today' : displayDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
          {!isToday && (
            <button onClick={() => setSelectedDate(dateStr(new Date()))} className="text-xs text-emerald-600 hover:underline">
              Back to today
            </button>
          )}
        </div>
        <button
          onClick={() => goDay(1)}
          disabled={isToday}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Daily summary */}
      {data && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Calories</span>
              <span className="font-bold text-sm">
                {Math.round(data.totals.calories)} / {data.dailyTarget} kcal
              </span>
            </div>
            <Progress value={caloriePercent} className="h-2" />
            <MacroRings
              protein={data.totals.protein}
              carbs={data.totals.carbs}
              fat={data.totals.fat}
            />
          </CardContent>
        </Card>
      )}

      {/* Log form */}
      {showForm && isToday && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Utensils className="h-4 w-4" /> What did you eat?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={mealType} onValueChange={v => v && setMealType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
                <SelectItem value="lunch">☀️ Lunch</SelectItem>
                <SelectItem value="dinner">🌙 Dinner</SelectItem>
                <SelectItem value="snack">🍎 Snack</SelectItem>
              </SelectContent>
            </Select>

            {/* Quick-add meal library */}
            {mealType && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Quick add
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_MEALS[mealType]?.map(m => (
                    <button
                      key={m.label}
                      onClick={() => setDescription(m.desc)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        description === m.desc
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted hover:bg-accent'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Textarea
              placeholder="Describe what you had — e.g., '2 rotis with dal and sabzi, 1 glass curd'"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              No need to weigh. Just describe naturally — AI handles the rest.
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
      {pageLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {(!data?.logs || data.logs.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <Utensils className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No meals logged{isToday ? ' today' : ' on this day'}.</p>
              {isToday && <p className="text-xs mt-1">Tap "Log Meal" to start tracking.</p>}
            </div>
          )}
          {data?.logs.map(log => (
            <FoodLogCard key={log.id} log={log} onDelete={deleteLog} deleting={deleting === log.id} />
          ))}
        </div>
      )}
    </div>
  )
}

function FoodLogCard({ log, onDelete, deleting }: { log: FoodLog; onDelete: (id: string) => void; deleting: boolean }) {
  const mealEmojis: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }
  return (
    <Card>
      <CardContent className="pt-3 pb-3">
        <div className="flex justify-between items-start gap-2">
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
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 leading-relaxed">{log.aiAnalysis}</p>
            )}
          </div>
          <div className="flex items-start gap-2 shrink-0">
            <div className="text-right">
              <span className="font-bold text-sm">{log.calories} kcal</span>
              <p className="text-xs text-muted-foreground">{log.protein}g protein</p>
            </div>
            <button
              onClick={() => onDelete(log.id)}
              disabled={deleting}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MacroChip({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600', yellow: 'text-yellow-600', orange: 'text-orange-600',
  }
  return (
    <div className="text-center">
      <p className={`font-bold text-sm ${colors[color]}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
