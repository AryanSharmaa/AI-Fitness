'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { CheckCircle2, XCircle, Dumbbell, Clock, Zap, Flame, Footprints, Route } from 'lucide-react'
import { toast } from 'sonner'
import { estimateCaloriesBurned, stepsToKm } from '@/lib/activity'

interface Exercise {
  name: string
  sets?: number
  reps?: number | string
  duration?: number
  rest?: number
  notes?: string
}

interface SuggestedWorkout {
  name: string
  type: string
  duration: number
  exercises: Exercise[]
  notes?: string
}

const CARDIO_TYPES = ['cardio', 'run', 'walk', 'cycling', 'swimming', 'hiit']

export default function WorkoutTracker() {
  const [suggested, setSuggested] = useState<SuggestedWorkout | null>(null)
  const [loading, setLoading] = useState(true)
  const [logging, setLogging] = useState(false)
  const [skipReason, setSkipReason] = useState('')
  const [showSkipForm, setShowSkipForm] = useState(false)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [shownNames, setShownNames] = useState<string[]>([])
  const [steps, setSteps] = useState('')
  const [distance, setDistance] = useState('')
  const [userWeight, setUserWeight] = useState(70)

  useEffect(() => {
    loadSuggestion()
    // Fetch user weight for calorie estimate
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d.profile?.weight) setUserWeight(d.profile.weight)
    })
  }, [])

  async function loadSuggestion(different = false) {
    setLoading(true)
    setCompleted(new Set())
    setSteps('')
    setDistance('')
    try {
      const exclude = different ? shownNames.join('|') : ''
      const url = `/api/workout?action=suggest${exclude ? `&exclude=${encodeURIComponent(exclude)}` : ''}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setSuggested(data.workout)
        if (data.workout?.name) {
          setShownNames(prev => [...new Set([...prev, data.workout.name])])
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function logWorkout(skipped: boolean) {
    if (!suggested) return
    setLogging(true)
    try {
      const res = await fetch('/api/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: suggested.type,
          duration: suggested.duration,
          exercises: suggested.exercises,
          completed: !skipped,
          skipped,
          skipReason: skipped ? skipReason : undefined,
          steps: steps ? parseInt(steps) : undefined,
          distance: distance ? parseFloat(distance) : steps ? stepsToKm(parseInt(steps)) : undefined,
        }),
      })
      if (!res.ok) throw new Error()
      if (skipped) {
        toast.info("Got it. Rest days are part of the plan. Your coach will adapt.")
      } else {
        const burn = estimateCaloriesBurned(suggested.type, suggested.duration, userWeight)
        toast.success(`Workout logged! ~${burn} kcal burned 🔥`)
      }
      setShowSkipForm(false)
    } catch {
      toast.error('Failed to log. Try again.')
    } finally {
      setLogging(false)
    }
  }

  function toggleExercise(name: string) {
    setCompleted(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-48 bg-muted rounded" />
      </div>
    )
  }

  const isCardio = suggested && CARDIO_TYPES.includes(suggested.type.toLowerCase())
  const estimatedBurn = suggested ? estimateCaloriesBurned(suggested.type, suggested.duration, userWeight) : 0

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Today's Workout</h1>

      {suggested && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{suggested.name}</CardTitle>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {suggested.duration} min
                    </Badge>
                    <Badge variant="secondary" className="capitalize">{suggested.type}</Badge>
                    <Badge variant="secondary" className="text-orange-600 dark:text-orange-400">
                      <Flame className="h-3 w-3 mr-1" />
                      ~{estimatedBurn} kcal
                    </Badge>
                  </div>
                </div>
                <Dumbbell className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggested.exercises.map((ex, i) => {
                const done = completed.has(ex.name)
                return (
                  <button
                    key={i}
                    onClick={() => toggleExercise(ex.name)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      done ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800' : 'hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        done ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground'
                      }`}>
                        {done && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${done ? 'line-through text-muted-foreground' : ''}`}>
                          {ex.name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : ex.duration ? `${ex.duration}s` : ''}
                          {ex.rest ? ` · rest ${ex.rest}s` : ''}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}

              {suggested.notes && (
                <p className="text-xs text-muted-foreground italic pt-1">{suggested.notes}</p>
              )}

              <div className="pt-2 text-sm text-muted-foreground">
                {completed.size} / {suggested.exercises.length} exercises done
              </div>

              {/* Cardio extras: steps + distance */}
              {isCardio && (
                <div className="pt-2 border-t space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Optional activity details</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Footprints className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Steps"
                        value={steps}
                        onChange={e => setSteps(e.target.value)}
                        className="pl-7 h-9 text-sm"
                      />
                    </div>
                    <div className="relative">
                      <Route className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Distance (km)"
                        value={distance}
                        onChange={e => setDistance(e.target.value)}
                        step="0.1"
                        className="pl-7 h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action buttons */}
          {!showSkipForm ? (
            <div className="flex gap-3">
              <Button
                onClick={() => logWorkout(false)}
                disabled={logging}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {logging ? 'Logging...' : 'Done! Log Workout'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSkipForm(true)}
                disabled={logging}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Skip
              </Button>
            </div>
          ) : (
            <Card className="border-orange-200">
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm font-medium">What's stopping you today? (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {['Tired', 'No time', 'Injury', 'Sick', 'Stress', 'DOMS'].map(r => (
                    <button
                      key={r}
                      onClick={() => setSkipReason(r)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        skipReason === r ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Or tell me more..."
                  value={skipReason}
                  onChange={e => setSkipReason(e.target.value)}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  No judgment. Your coach will adjust the plan for tomorrow.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => logWorkout(true)}
                    disabled={logging}
                    className="flex-1"
                  >
                    {logging ? 'Saving...' : 'Skip Today'}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowSkipForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground"
        onClick={() => loadSuggestion(true)}
      >
        <Zap className="h-4 w-4 mr-1" />
        Suggest a different workout
      </Button>
    </div>
  )
}
