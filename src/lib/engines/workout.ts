export interface WorkoutPlan {
  name: string
  type: 'strength' | 'cardio' | 'hiit' | 'yoga' | 'recovery' | 'minimal'
  duration: number
  exercises: Exercise[]
  notes?: string
}

export interface Exercise {
  name: string
  sets?: number
  reps?: number | string
  duration?: number // seconds
  rest?: number // seconds
  notes?: string
}

const HOME_WORKOUTS: Record<string, WorkoutPlan> = {
  beginner_strength: {
    name: 'Beginner Home Strength',
    type: 'strength',
    duration: 30,
    exercises: [
      { name: 'Wall Push-ups or Knee Push-ups', sets: 3, reps: 10, rest: 60 },
      { name: 'Bodyweight Squats', sets: 3, reps: 15, rest: 60 },
      { name: 'Glute Bridge', sets: 3, reps: 15, rest: 45 },
      { name: 'Standing Dumbbell Row (or resistance band)', sets: 3, reps: 12, rest: 60 },
      { name: 'Plank Hold', sets: 3, reps: '20-30 sec', rest: 45 },
    ],
  },
  intermediate_hiit: {
    name: 'Intermediate HIIT',
    type: 'hiit',
    duration: 25,
    exercises: [
      { name: 'Jumping Jacks', duration: 40, rest: 20, sets: 1 },
      { name: 'Burpees', duration: 30, rest: 30, sets: 1 },
      { name: 'Mountain Climbers', duration: 40, rest: 20, sets: 1 },
      { name: 'Jump Squats', duration: 30, rest: 30, sets: 1 },
      { name: 'High Knees', duration: 40, rest: 20, sets: 1 },
      { name: 'Push-ups', duration: 30, rest: 30, sets: 1 },
    ],
    notes: 'Complete 3-4 rounds. Rest 90 sec between rounds.',
  },
  minimal_10min: {
    name: '10-Minute Minimal Workout',
    type: 'minimal',
    duration: 10,
    exercises: [
      { name: 'Push-ups', sets: 2, reps: 10, rest: 30 },
      { name: 'Squats', sets: 2, reps: 15, rest: 30 },
      { name: 'Plank', sets: 2, reps: '20 sec', rest: 30 },
    ],
    notes: 'Better than nothing. Gets blood flowing.',
  },
  recovery: {
    name: 'Active Recovery',
    type: 'recovery',
    duration: 20,
    exercises: [
      { name: 'Light Walk or March in Place', duration: 300 },
      { name: 'Hip Flexor Stretch', duration: 60, sets: 2 },
      { name: 'Hamstring Stretch', duration: 60, sets: 2 },
      { name: 'Shoulder Rolls', duration: 60 },
      { name: 'Cat-Cow Stretch', reps: 10, sets: 2 },
      { name: 'Child\'s Pose', duration: 60 },
    ],
    notes: 'Gentle movement. Focus on breathing.',
  },
  yoga_morning: {
    name: 'Morning Yoga Flow',
    type: 'yoga',
    duration: 20,
    exercises: [
      { name: 'Sun Salutation A', sets: 3 },
      { name: 'Warrior I & II', duration: 30, sets: 2 },
      { name: 'Downward Dog', duration: 60 },
      { name: 'Bridge Pose', duration: 30, sets: 3 },
      { name: 'Supine Twist', duration: 30, sets: 2 },
    ],
  },
}

const GYM_WORKOUTS: Record<string, WorkoutPlan> = {
  push_day: {
    name: 'Push Day (Chest, Shoulders, Triceps)',
    type: 'strength',
    duration: 45,
    exercises: [
      { name: 'Bench Press', sets: 4, reps: '8-10', rest: 90 },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rest: 75 },
      { name: 'Shoulder Press', sets: 3, reps: '10-12', rest: 75 },
      { name: 'Lateral Raises', sets: 3, reps: '12-15', rest: 60 },
      { name: 'Tricep Pushdown', sets: 3, reps: '12-15', rest: 60 },
      { name: 'Overhead Tricep Extension', sets: 3, reps: '12-15', rest: 60 },
    ],
  },
  pull_day: {
    name: 'Pull Day (Back, Biceps)',
    type: 'strength',
    duration: 45,
    exercises: [
      { name: 'Deadlift or Romanian Deadlift', sets: 4, reps: '6-8', rest: 120 },
      { name: 'Barbell Row or Cable Row', sets: 4, reps: '8-10', rest: 90 },
      { name: 'Lat Pulldown', sets: 3, reps: '10-12', rest: 75 },
      { name: 'Face Pulls', sets: 3, reps: '15', rest: 60 },
      { name: 'Barbell Curl', sets: 3, reps: '10-12', rest: 60 },
      { name: 'Hammer Curl', sets: 3, reps: '12', rest: 60 },
    ],
  },
  leg_day: {
    name: 'Leg Day',
    type: 'strength',
    duration: 50,
    exercises: [
      { name: 'Squat', sets: 4, reps: '8-10', rest: 120 },
      { name: 'Leg Press', sets: 3, reps: '12', rest: 90 },
      { name: 'Romanian Deadlift', sets: 3, reps: '10', rest: 90 },
      { name: 'Leg Curl', sets: 3, reps: '12', rest: 60 },
      { name: 'Calf Raises', sets: 4, reps: '15', rest: 45 },
      { name: 'Leg Extension', sets: 3, reps: '15', rest: 60 },
    ],
  },
}

export function selectWorkout(params: {
  equipment: string
  sleepHours: number
  goal: string
  lastWorkoutType?: string
  hasDOMS: boolean
  hasInjury: boolean
  hasTime: number
  isNightShift: boolean
  exclude?: string[] // names to skip for "suggest different"
}): WorkoutPlan {
  const { equipment, sleepHours, hasInjury, hasDOMS, hasTime, isNightShift, exclude = [] } = params

  // Build a candidate list based on conditions, then pick first not in exclude
  const candidates: WorkoutPlan[] = []

  if (hasInjury) {
    candidates.push(HOME_WORKOUTS.recovery, HOME_WORKOUTS.minimal_10min, HOME_WORKOUTS.yoga_morning)
  } else if (sleepHours < 5 || (isNightShift && sleepHours < 6)) {
    candidates.push(HOME_WORKOUTS.recovery, HOME_WORKOUTS.minimal_10min, HOME_WORKOUTS.yoga_morning)
  } else if (hasDOMS) {
    candidates.push(HOME_WORKOUTS.yoga_morning, HOME_WORKOUTS.recovery, HOME_WORKOUTS.minimal_10min, HOME_WORKOUTS.beginner_strength)
  } else if (hasTime <= 15) {
    candidates.push(HOME_WORKOUTS.minimal_10min, HOME_WORKOUTS.beginner_strength)
  } else if (equipment === 'gym') {
    const lastType = params.lastWorkoutType
    if (lastType === 'push') {
      candidates.push(GYM_WORKOUTS.pull_day, GYM_WORKOUTS.leg_day, GYM_WORKOUTS.push_day)
    } else if (lastType === 'pull') {
      candidates.push(GYM_WORKOUTS.leg_day, GYM_WORKOUTS.push_day, GYM_WORKOUTS.pull_day)
    } else {
      candidates.push(GYM_WORKOUTS.push_day, GYM_WORKOUTS.pull_day, GYM_WORKOUTS.leg_day)
    }
    // also add home options as fallback alternates
    candidates.push(HOME_WORKOUTS.intermediate_hiit, HOME_WORKOUTS.beginner_strength)
  } else if (equipment === 'none') {
    candidates.push(
      hasTime >= 25 ? HOME_WORKOUTS.intermediate_hiit : HOME_WORKOUTS.beginner_strength,
      HOME_WORKOUTS.beginner_strength,
      HOME_WORKOUTS.intermediate_hiit,
      HOME_WORKOUTS.yoga_morning,
      HOME_WORKOUTS.minimal_10min,
    )
  } else {
    candidates.push(
      HOME_WORKOUTS.beginner_strength,
      HOME_WORKOUTS.intermediate_hiit,
      HOME_WORKOUTS.yoga_morning,
      HOME_WORKOUTS.minimal_10min,
    )
  }

  // Return first candidate not in the exclude list
  const pick = candidates.find(c => !exclude.includes(c.name))
  return pick ?? candidates[0]
}

export function formatWorkoutForDisplay(plan: WorkoutPlan): string {
  const lines = [`**${plan.name}** (${plan.duration} min)\n`]
  for (const ex of plan.exercises) {
    const detail = ex.sets && ex.reps
      ? `${ex.sets}×${ex.reps}`
      : ex.duration
      ? `${ex.duration}s`
      : ''
    lines.push(`• ${ex.name} — ${detail}${ex.rest ? `, rest ${ex.rest}s` : ''}`)
  }
  if (plan.notes) lines.push(`\n_${plan.notes}_`)
  return lines.join('\n')
}
