// Recovery & Readiness Score (0–100)
// Inputs: sleep, streak, DOMS risk, recent skips, mood (if logged)

export interface RecoveryInput {
  sleepHours: number
  workoutStreak: number
  missedLast3Days: number       // skipped workout logs last 3 days
  hasDOMSRisk: boolean          // completed strength/HIIT < 48h ago
  lastMoodScore?: number        // 1–5 from mood journal, optional
  hasInjury: boolean
  consecutiveWorkoutDays: number // days with completed workout in a row
}

export interface RecoveryResult {
  score: number                 // 0–100
  label: 'Poor' | 'Low' | 'Moderate' | 'Good' | 'Peak'
  color: string
  advice: string
  suggestedIntensity: 'rest' | 'light' | 'moderate' | 'high'
}

export function calcRecoveryScore(input: RecoveryInput): RecoveryResult {
  let score = 70 // baseline

  // Sleep scoring (most impactful)
  if (input.sleepHours >= 8) score += 15
  else if (input.sleepHours >= 7) score += 10
  else if (input.sleepHours >= 6) score += 0
  else if (input.sleepHours >= 5) score -= 15
  else score -= 25

  // DOMS risk
  if (input.hasDOMSRisk) score -= 15

  // Injury
  if (input.hasInjury) score -= 30

  // Recent skips suggest fatigue/stress
  if (input.missedLast3Days >= 2) score -= 10
  else if (input.missedLast3Days === 1) score -= 5

  // Too many consecutive days without rest
  if (input.consecutiveWorkoutDays >= 6) score -= 15
  else if (input.consecutiveWorkoutDays >= 4) score -= 5
  else if (input.consecutiveWorkoutDays >= 2) score += 5

  // Mood bonus/penalty
  if (input.lastMoodScore !== undefined) {
    if (input.lastMoodScore >= 4) score += 8
    else if (input.lastMoodScore === 3) score += 0
    else if (input.lastMoodScore <= 2) score -= 12
  }

  score = Math.max(0, Math.min(100, Math.round(score)))

  if (score >= 80) return { score, label: 'Peak', color: '#10b981', advice: 'Your body is ready. Push hard today.', suggestedIntensity: 'high' }
  if (score >= 65) return { score, label: 'Good', color: '#22c55e', advice: 'Good to train. Keep intensity moderate to high.', suggestedIntensity: 'moderate' }
  if (score >= 50) return { score, label: 'Moderate', color: '#f59e0b', advice: 'Train but keep it moderate. Prioritise sleep tonight.', suggestedIntensity: 'moderate' }
  if (score >= 35) return { score, label: 'Low', color: '#f97316', advice: 'Light activity only today. Sleep and eat well.', suggestedIntensity: 'light' }
  return { score, label: 'Poor', color: '#ef4444', advice: 'Rest day recommended. Recovery is part of progress.', suggestedIntensity: 'rest' }
}
