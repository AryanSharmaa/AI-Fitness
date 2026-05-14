export interface UserProfile {
  id: string
  userId: string
  age?: number
  height?: number
  weight?: number
  gender?: string
  goal?: string
  workSchedule?: string
  sleepHours?: number
  foodPreference?: string
  medicalNotes?: string
  equipmentAccess?: string
  cookingSkill?: string
  riskProfile?: string
  disciplineScore: number
  onboardingDone: boolean
}

export interface FoodLog {
  id: string
  userId: string
  date: string
  meal: string
  description: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  inputMethod: 'text' | 'voice'
  aiAnalysis?: string
}

export interface WorkoutLog {
  id: string
  userId: string
  date: string
  type: string
  duration?: number
  exercises?: Exercise[]
  notes?: string
  completed: boolean
  skipped: boolean
  skipReason?: string
}

export interface Exercise {
  name: string
  sets?: number
  reps?: number
  duration?: number
  weight?: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agentType?: 'planner' | 'critic' | 'behavior' | 'safety'
  createdAt: string
}

export interface DashboardStats {
  workoutStreak: number
  nutritionStreak: number
  overallStreak: number
  weeklyCalories: number
  weeklyWorkouts: number
  disciplineScore: number
  todayPlan?: string
  recentBehavior?: string
}

export type Goal = 'fat_loss' | 'muscle' | 'discipline' | 'maintenance'
export type WorkSchedule = 'day' | 'night' | 'rotating'
export type FoodPreference = 'veg' | 'non_veg' | 'eggs'
export type EquipmentAccess = 'none' | 'home' | 'gym'
export type CookingSkill = 'basic' | 'intermediate' | 'advanced'
