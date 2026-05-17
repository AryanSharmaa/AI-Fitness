'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2, RefreshCw, Utensils, UtensilsCrossed } from 'lucide-react'
import { toast } from 'sonner'

interface MealSuggestion {
  meal: string
  suggestion: string
  calories: number
  protein: number
  carbs: number
  fat: number
  reason: string
}

interface MealPlanData {
  consumed: { calories: number; protein: number; carbs: number; fat: number }
  remaining: { calories: number; protein: number; carbs: number; fat: number }
  goals: { calories: number; protein: number; carbs: number; fat: number }
  suggestions: MealSuggestion[]
}

const MEAL_EMOJIS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
}

const MEAL_BORDER_COLORS: Record<string, string> = {
  breakfast: 'border-l-amber-400',
  lunch: 'border-l-yellow-400',
  dinner: 'border-l-indigo-400',
  snack: 'border-l-emerald-400',
}

function getMealKey(meal: string) {
  return meal.toLowerCase()
}

function MacroChip({
  label,
  value,
  unit = 'g',
  colorClass,
}: {
  label: string
  value: number
  unit?: string
  colorClass: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${colorClass}`}
    >
      <span className="font-bold">{value}</span>
      <span className="opacity-75">
        {unit} {label}
      </span>
    </span>
  )
}

function MacroBar({
  label,
  consumed,
  goal,
  colorClass,
  trackClass,
}: {
  label: string
  consumed: number
  goal: number
  colorClass: string
  trackClass: string
}) {
  const pct = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {consumed}g / {goal}g
        </span>
      </div>
      <div className={`h-2 rounded-full ${trackClass}`}>
        <div
          className={`h-2 rounded-full transition-all ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-l-4 border-l-muted bg-card p-4 animate-pulse space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-5 w-16 rounded-full bg-muted" />
        <div className="h-5 w-8 rounded bg-muted" />
      </div>
      <div className="h-5 w-3/4 rounded bg-muted" />
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 w-14 rounded-full bg-muted" />
        ))}
      </div>
      <div className="h-3 w-full rounded bg-muted" />
    </div>
  )
}

export default function MealPlanPage() {
  const [data, setData] = useState<MealPlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [loggingId, setLoggingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchPlan = useCallback(async (regenerate = false) => {
    setError(null)
    if (regenerate) setRegenerating(true)
    else setLoading(true)
    try {
      const url = regenerate ? '/api/meal-plan?regenerate=1' : '/api/meal-plan'
      const res = await fetch(url)
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Failed to load meal plan')
      }
      const json = (await res.json()) as MealPlanData
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setRegenerating(false)
    }
  }, [])

  useEffect(() => {
    fetchPlan()
  }, [fetchPlan])

  async function logSuggestion(suggestion: MealSuggestion, index: number) {
    setLoggingId(index)
    try {
      const res = await fetch('/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: suggestion.suggestion,
          mealType: getMealKey(suggestion.meal),
          inputMethod: 'ai_plan',
        }),
      })
      if (!res.ok) throw new Error('Failed to log meal')
      toast.success(`${suggestion.suggestion} logged!`)
    } catch {
      toast.error('Could not log meal. Try again.')
    } finally {
      setLoggingId(null)
    }
  }

  const calorieGoal = data?.goals.calories ?? 0
  const caloriesConsumed = data?.consumed.calories ?? 0
  const caloriePct = calorieGoal > 0 ? Math.min(100, (caloriesConsumed / calorieGoal) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header card */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Smart Meal Plan</h1>
              <p className="text-sm text-white/80 mt-0.5">For Today</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchPlan(true)}
            disabled={regenerating || loading}
            className="text-white hover:bg-white/20 hover:text-white gap-1.5"
          >
            {regenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="text-sm">Regenerate</span>
          </Button>
        </div>
      </div>

      {/* Progress section */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium">Calories</span>
              <span className="text-muted-foreground">
                {caloriesConsumed} / {calorieGoal} kcal
              </span>
            </div>
            <Progress value={caloriePct} className="h-2.5" />
          </div>

          <div className="grid grid-cols-1 gap-3 pt-1">
            <MacroBar
              label="Protein"
              consumed={data?.consumed.protein ?? 0}
              goal={data?.goals.protein ?? 0}
              colorClass="bg-blue-500"
              trackClass="bg-blue-100 dark:bg-blue-950/40"
            />
            <MacroBar
              label="Carbs"
              consumed={data?.consumed.carbs ?? 0}
              goal={data?.goals.carbs ?? 0}
              colorClass="bg-yellow-500"
              trackClass="bg-yellow-100 dark:bg-yellow-950/40"
            />
            <MacroBar
              label="Fat"
              consumed={data?.consumed.fat ?? 0}
              goal={data?.goals.fat ?? 0}
              colorClass="bg-rose-400"
              trackClass="bg-rose-100 dark:bg-rose-950/40"
            />
          </div>

          {data && (
            <p className="text-xs text-muted-foreground pt-1">
              {data.remaining.calories > 0
                ? `${data.remaining.calories} kcal remaining today`
                : "You've hit your calorie goal for today!"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Suggestions */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">What to eat next</h2>

        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-dashed border-muted-foreground/30 py-12 text-center space-y-3">
            <UtensilsCrossed className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchPlan()}>
              Try again
            </Button>
          </div>
        ) : !data?.suggestions.length ? (
          <div className="rounded-2xl border border-dashed border-muted-foreground/30 py-12 text-center space-y-3">
            <UtensilsCrossed className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No suggestions available right now.</p>
            <Button variant="outline" size="sm" onClick={() => fetchPlan(true)}>
              Regenerate plan
            </Button>
          </div>
        ) : (
          data.suggestions.map((s, i) => {
            const mealKey = getMealKey(s.meal)
            const borderColor = MEAL_BORDER_COLORS[mealKey] ?? 'border-l-orange-400'
            const emoji = MEAL_EMOJIS[mealKey] ?? '🍽️'

            return (
              <div
                key={i}
                className={`rounded-2xl border border-l-4 ${borderColor} bg-card p-4 space-y-2.5 shadow-sm`}
              >
                {/* Meal type pill + emoji */}
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold capitalize"
                  >
                    <span>{emoji}</span>
                    {s.meal}
                  </span>
                </div>

                {/* Dish name */}
                <p className="text-base font-bold leading-snug">{s.suggestion}</p>

                {/* Macro chips */}
                <div className="flex flex-wrap gap-1.5">
                  <MacroChip
                    label="kcal"
                    value={s.calories}
                    unit=""
                    colorClass="bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400"
                  />
                  <MacroChip
                    label="protein"
                    value={s.protein}
                    colorClass="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                  />
                  <MacroChip
                    label="carbs"
                    value={s.carbs}
                    colorClass="bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                  />
                  <MacroChip
                    label="fat"
                    value={s.fat}
                    colorClass="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                  />
                </div>

                {/* Reason */}
                <p className="text-xs text-muted-foreground italic leading-relaxed">{s.reason}</p>

                {/* Log This button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-1"
                  disabled={loggingId === i}
                  onClick={() => logSuggestion(s, i)}
                >
                  {loggingId === i ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Logging…
                    </>
                  ) : (
                    'Log This'
                  )}
                </Button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
