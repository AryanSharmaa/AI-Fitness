'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dumbbell, Plus, Trash2, Play, ArrowLeft, Loader2 } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Exercise {
  id: string
  name: string
  sets: string
  reps: string
  duration: string
  weight: string
  notes: string
}

interface CustomRoutine {
  id: string
  name: string
  type: string
  exercises: Exercise[]
  notes?: string | null
  createdAt: string
  updatedAt: string
}

type WorkoutType = 'strength' | 'cardio' | 'hiit' | 'yoga'

interface FormState {
  name: string
  type: WorkoutType
  exercises: Exercise[]
  notes: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function blankExercise(): Exercise {
  return { id: cuid(), name: '', sets: '', reps: '', duration: '', weight: '', notes: '' }
}

const TYPE_STYLES: Record<string, string> = {
  strength: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  cardio: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  hiit: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  yoga: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

function estimateDuration(exercises: Exercise[]): number {
  return Math.max(
    1,
    exercises.reduce((acc, ex) => {
      const sets = parseInt(ex.sets) || 1
      const reps = parseInt(ex.reps) || 10
      return acc + (sets * reps) / 10
    }, 0)
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WorkoutBuilder() {
  const [routines, setRoutines] = useState<CustomRoutine[]>([])
  const [loading, setLoading] = useState(true)
  const [building, setBuilding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [startingId, setStartingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>({
    name: '',
    type: 'strength',
    exercises: [blankExercise()],
    notes: '',
  })

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  async function fetchRoutines() {
    try {
      const res = await fetch('/api/routines')
      if (!res.ok) throw new Error('Failed to load routines')
      const data = await res.json()
      setRoutines(data.routines)
    } catch {
      toast.error('Could not load routines')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoutines()
  }, [])

  // -------------------------------------------------------------------------
  // Form helpers
  // -------------------------------------------------------------------------

  function updateExercise(id: string, field: keyof Exercise, value: string) {
    setForm(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => (ex.id === id ? { ...ex, [field]: value } : ex)),
    }))
  }

  function addExercise() {
    setForm(prev => ({ ...prev, exercises: [...prev.exercises, blankExercise()] }))
  }

  function removeExercise(id: string) {
    setForm(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== id),
    }))
  }

  function resetForm() {
    setForm({ name: '', type: 'strength', exercises: [blankExercise()], notes: '' })
  }

  function goBack() {
    setBuilding(false)
    resetForm()
  }

  // -------------------------------------------------------------------------
  // Save routine
  // -------------------------------------------------------------------------

  async function saveRoutine() {
    if (!form.name.trim()) {
      toast.error('Please enter a routine name')
      return
    }
    const validExercises = form.exercises.filter(ex => ex.name.trim())
    if (validExercises.length === 0) {
      toast.error('Please add at least one exercise')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          exercises: validExercises,
          notes: form.notes.trim() || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Routine saved!')
      await fetchRoutines()
      goBack()
    } catch {
      toast.error('Could not save routine')
    } finally {
      setSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Start routine (log workout)
  // -------------------------------------------------------------------------

  async function startRoutine(routine: CustomRoutine) {
    setStartingId(routine.id)
    try {
      const res = await fetch('/api/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: routine.type,
          duration: estimateDuration(routine.exercises),
          exercises: routine.exercises,
          notes: `Custom routine: ${routine.name}`,
        }),
      })
      if (!res.ok) throw new Error('Failed to log workout')
      toast.success(`"${routine.name}" logged as workout!`)
    } catch {
      toast.error('Could not start routine')
    } finally {
      setStartingId(null)
    }
  }

  // -------------------------------------------------------------------------
  // Delete routine
  // -------------------------------------------------------------------------

  async function deleteRoutine(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/routines?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Routine deleted')
      setRoutines(prev => prev.filter(r => r.id !== id))
    } catch {
      toast.error('Could not delete routine')
    } finally {
      setDeletingId(null)
    }
  }

  // -------------------------------------------------------------------------
  // VIEW 2 — Builder Form
  // -------------------------------------------------------------------------

  if (building) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold">Build Routine</h1>
        </div>

        <div className="space-y-5">
          {/* Routine Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Routine Name</label>
            <Input
              placeholder="e.g. Morning Push Day"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="h-10"
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type</label>
            <Select
              value={form.type}
              onValueChange={(val: string) =>
                setForm(prev => ({ ...prev, type: val as WorkoutType }))
              }
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="hiit">HIIT</SelectItem>
                <SelectItem value="yoga">Yoga</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Exercises */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Exercises</label>
            {form.exercises.map((ex, idx) => (
              <div
                key={ex.id}
                className="rounded-2xl border bg-card p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Exercise {idx + 1}
                  </span>
                  {form.exercises.length > 1 && (
                    <button
                      onClick={() => removeExercise(ex.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove exercise"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <Input
                  placeholder="Exercise name"
                  value={ex.name}
                  onChange={e => updateExercise(ex.id, 'name', e.target.value)}
                  className="h-9"
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Sets</label>
                    <Input
                      type="number"
                      placeholder="3"
                      min="1"
                      value={ex.sets}
                      onChange={e => updateExercise(ex.id, 'sets', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Reps</label>
                    <Input
                      type="number"
                      placeholder="10"
                      min="1"
                      value={ex.reps}
                      onChange={e => updateExercise(ex.id, 'reps', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Duration (s)</label>
                    <Input
                      type="number"
                      placeholder="30"
                      min="0"
                      value={ex.duration}
                      onChange={e => updateExercise(ex.id, 'duration', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Weight (kg)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      step="0.5"
                      value={ex.weight}
                      onChange={e => updateExercise(ex.id, 'weight', e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={addExercise}
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4" />
              Add Exercise
            </Button>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              placeholder="Any notes about this routine..."
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              className="min-h-20 resize-none"
            />
          </div>

          {/* Save */}
          <Button
            onClick={saveRoutine}
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white h-10"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Routine'
            )}
          </Button>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // VIEW 1 — Routines List
  // -------------------------------------------------------------------------

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Routines</h1>
        <Button
          onClick={() => setBuilding(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Routine
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && routines.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="rounded-full bg-muted p-5">
            <Dumbbell className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-lg">No routines yet</p>
            <p className="text-muted-foreground text-sm mt-1">Create your first routine to get started</p>
          </div>
          <Button
            onClick={() => setBuilding(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white mt-2"
          >
            <Plus className="h-4 w-4" />
            Create your first routine
          </Button>
        </div>
      )}

      {/* Routine cards */}
      {!loading && routines.length > 0 && (
        <div className="space-y-4">
          {routines.map(routine => {
            const exercises = Array.isArray(routine.exercises) ? routine.exercises : []
            const isStarting = startingId === routine.id
            const isDeleting = deletingId === routine.id

            return (
              <div
                key={routine.id}
                className="rounded-2xl border bg-card p-5 space-y-3 hover:shadow-sm transition-shadow"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <h2 className="font-semibold text-base truncate">{routine.name}</h2>
                    <span
                      className={`inline-block text-xs font-medium rounded-full px-2 py-0.5 ${
                        TYPE_STYLES[routine.type] ?? 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {routine.type.charAt(0).toUpperCase() + routine.type.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Exercise count + notes */}
                <div className="text-sm text-muted-foreground">
                  <span>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
                  {routine.notes && (
                    <span className="ml-2 before:content-['·'] before:mr-2 truncate">
                      {routine.notes}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => startRoutine(routine)}
                    disabled={isStarting || isDeleting}
                    className="bg-orange-500 hover:bg-orange-600 text-white flex-1"
                  >
                    {isStarting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteRoutine(routine.id)}
                    disabled={isStarting || isDeleting}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    aria-label="Delete routine"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
