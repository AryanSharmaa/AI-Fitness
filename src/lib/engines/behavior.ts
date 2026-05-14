export type BehaviorEvent =
  | 'missed_workout'
  | 'skipped_meal'
  | 'binge'
  | 'streak_broken'
  | 'completed_workout'
  | 'logged_meal'
  | 'early_workout'
  | 'stress_day'
  | 'travel_day'
  | 'festival_day'
  | 'injury'
  | 'no_hunger'
  | 'late_night_craving'

export interface BehaviorPattern {
  missedWorkoutsLast7Days: number
  skippedMealsLast7Days: number
  consecutiveMissed: number
  currentStreak: number
  lastEvent: BehaviorEvent | null
  riskLevel: 'low' | 'medium' | 'high'
  tone: 'strict' | 'balanced' | 'supportive'
}

export function analyzeBehaviorPattern(logs: Array<{
  event: BehaviorEvent
  date: Date
}>): BehaviorPattern {
  const now = new Date()
  const last7 = logs.filter(l => {
    const diff = (now.getTime() - l.date.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 7
  })

  const missedWorkouts = last7.filter(l => l.event === 'missed_workout').length
  const skippedMeals = last7.filter(l => l.event === 'skipped_meal').length

  // Count consecutive missed days
  const sorted = [...logs].sort((a, b) => b.date.getTime() - a.date.getTime())
  let consecutive = 0
  for (const log of sorted) {
    if (log.event === 'missed_workout') consecutive++
    else if (log.event === 'completed_workout') break
  }

  // Count current streak
  let streak = 0
  for (const log of sorted) {
    if (log.event === 'completed_workout' || log.event === 'logged_meal') streak++
    else if (log.event === 'missed_workout' || log.event === 'streak_broken') break
  }

  const riskLevel =
    missedWorkouts >= 4 || skippedMeals >= 4 ? 'high'
    : missedWorkouts >= 2 || skippedMeals >= 2 ? 'medium'
    : 'low'

  const tone =
    streak >= 5 ? 'strict'
    : riskLevel === 'high' ? 'supportive'
    : 'balanced'

  return {
    missedWorkoutsLast7Days: missedWorkouts,
    skippedMealsLast7Days: skippedMeals,
    consecutiveMissed: consecutive,
    currentStreak: streak,
    lastEvent: sorted[0]?.event || null,
    riskLevel,
    tone,
  }
}

export function getBehaviorSummary(logs: Array<{ event: BehaviorEvent; date: Date; details?: string }>): string {
  const pattern = analyzeBehaviorPattern(logs)
  const lines: string[] = []

  if (pattern.currentStreak > 0) lines.push(`Current streak: ${pattern.currentStreak} days`)
  if (pattern.missedWorkoutsLast7Days > 0) lines.push(`Missed workouts (7 days): ${pattern.missedWorkoutsLast7Days}`)
  if (pattern.skippedMealsLast7Days > 0) lines.push(`Skipped meals (7 days): ${pattern.skippedMealsLast7Days}`)
  if (pattern.consecutiveMissed > 1) lines.push(`Consecutive missed: ${pattern.consecutiveMissed}`)
  lines.push(`Risk level: ${pattern.riskLevel}, Tone: ${pattern.tone}`)

  // Include last 3 specific events for AI context
  const recent = logs.slice(0, 3).map(l => `${l.event}${l.details ? `: ${l.details}` : ''}`)
  if (recent.length > 0) lines.push(`Recent events: ${recent.join(', ')}`)

  return lines.join('\n')
}

export function getMinimumViableAction(
  missedType: 'workout' | 'meal',
  profile: { workSchedule?: string; equipmentAccess?: string; sleepHours?: number }
): string {
  if (missedType === 'workout') {
    const sleepDeprived = (profile.sleepHours || 7) < 6
    if (sleepDeprived) return '10-min light walk or stretching only — you need rest more than intensity'
    if (profile.equipmentAccess === 'none') return '15-min bodyweight: 3 rounds of 10 pushups, 15 squats, 20 jumping jacks'
    return '20-min workout: pick your hardest compound movement and do 4 sets'
  }

  return 'One high-protein snack: handful of nuts + 1 banana, or curd with fruit'
}

export function calculateDisciplineScore(logs: Array<{ event: BehaviorEvent; date: Date }>): number {
  const last30 = logs.filter(l => {
    const diff = (new Date().getTime() - l.date.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 30
  })

  let score = 50
  for (const log of last30) {
    switch (log.event) {
      case 'completed_workout': score += 3; break
      case 'logged_meal': score += 1; break
      case 'missed_workout': score -= 4; break
      case 'skipped_meal': score -= 2; break
      case 'binge': score -= 5; break
      case 'streak_broken': score -= 6; break
      case 'early_workout': score += 5; break
    }
  }

  return Math.min(100, Math.max(0, score))
}
