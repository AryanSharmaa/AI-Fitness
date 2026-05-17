// MET (Metabolic Equivalent of Task) values per workout type
// Calories burned = MET × weight_kg × duration_hours
const MET: Record<string, number> = {
  strength: 5.0,
  cardio: 7.5,
  hiit: 8.0,
  yoga: 3.0,
  stretching: 2.5,
  walk: 3.5,
  run: 9.8,
  cycling: 7.5,
  swimming: 8.0,
  sport: 7.0,
  general: 5.0,
}

export function estimateCaloriesBurned(type: string, durationMinutes: number, weightKg: number): number {
  const met = MET[type.toLowerCase()] ?? MET.general
  return Math.round(met * weightKg * (durationMinutes / 60))
}

// Steps → distance (avg stride ~0.75m)
export function stepsToKm(steps: number): number {
  return Math.round((steps * 0.00075) * 10) / 10
}

// Distance → steps
export function kmToSteps(km: number): number {
  return Math.round(km / 0.00075)
}

// Pace string from distance and duration
export function calcPace(km: number, minutes: number): string {
  if (!km || !minutes) return ''
  const paceMin = minutes / km
  const mins = Math.floor(paceMin)
  const secs = Math.round((paceMin - mins) * 60)
  return `${mins}:${secs.toString().padStart(2, '0')} /km`
}
