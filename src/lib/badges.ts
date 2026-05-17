export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earned: boolean
  earnedAt?: string
  category: 'workout' | 'nutrition' | 'streak' | 'milestone' | 'pro'
  pro?: boolean
}

interface BadgeInput {
  totalWorkouts: number
  totalFoodLogs: number
  workoutStreak: number
  bestWorkoutStreak: number
  totalCalories: number
  totalProtein: number
  joinedDaysAgo: number
  plan: 'free' | 'pro'
  workoutDates: string[]
  foodDates: string[]
}

export function computeBadges(input: BadgeInput): Badge[] {
  const {
    totalWorkouts,
    totalFoodLogs,
    workoutStreak,
    bestWorkoutStreak,
    totalCalories,
    joinedDaysAgo,
    plan,
    workoutDates,
    foodDates,
  } = input

  const workoutSet = new Set(workoutDates)
  const foodSet = new Set(foodDates)
  const fullDays = [...workoutSet].filter(d => foodSet.has(d)).length

  const badges: Badge[] = [
    // Workout badges
    {
      id: 'first_workout',
      name: 'First Step',
      description: 'Log your first workout',
      icon: '🏃',
      earned: totalWorkouts >= 1,
      category: 'workout',
    },
    {
      id: 'workout_5',
      name: 'Getting Started',
      description: 'Complete 5 workouts',
      icon: '💪',
      earned: totalWorkouts >= 5,
      category: 'workout',
    },
    {
      id: 'workout_25',
      name: 'Consistent',
      description: 'Complete 25 workouts',
      icon: '🔥',
      earned: totalWorkouts >= 25,
      category: 'workout',
    },
    {
      id: 'workout_100',
      name: 'Century',
      description: 'Complete 100 workouts',
      icon: '💯',
      earned: totalWorkouts >= 100,
      category: 'workout',
    },

    // Nutrition badges
    {
      id: 'first_meal',
      name: 'First Bite',
      description: 'Log your first meal',
      icon: '🥗',
      earned: totalFoodLogs >= 1,
      category: 'nutrition',
    },
    {
      id: 'food_7days',
      name: 'Week Tracker',
      description: 'Log food for 7 different days',
      icon: '📋',
      earned: foodSet.size >= 7,
      category: 'nutrition',
    },
    {
      id: 'food_30days',
      name: 'Monthly Tracker',
      description: 'Log food for 30 different days',
      icon: '📅',
      earned: foodSet.size >= 30,
      category: 'nutrition',
    },
    {
      id: 'calorie_goal',
      name: 'Calorie Counter',
      description: 'Log 10,000 total calories',
      icon: '⚡',
      earned: totalCalories >= 10000,
      category: 'nutrition',
    },

    // Streak badges
    {
      id: 'streak_3',
      name: '3-Day Streak',
      description: 'Work out 3 days in a row',
      icon: '🔥',
      earned: bestWorkoutStreak >= 3,
      category: 'streak',
    },
    {
      id: 'streak_7',
      name: 'Week Warrior',
      description: 'Work out 7 days in a row',
      icon: '⚔️',
      earned: bestWorkoutStreak >= 7,
      category: 'streak',
    },
    {
      id: 'streak_30',
      name: 'Iron Will',
      description: 'Work out 30 days in a row',
      icon: '🏆',
      earned: bestWorkoutStreak >= 30,
      category: 'streak',
    },

    // Milestone badges
    {
      id: 'full_day_5',
      name: 'Balance',
      description: 'Log both workout and food on 5 days',
      icon: '⚖️',
      earned: fullDays >= 5,
      category: 'milestone',
    },
    {
      id: 'full_day_30',
      name: 'Lifestyle',
      description: 'Log both workout and food on 30 days',
      icon: '🌟',
      earned: fullDays >= 30,
      category: 'milestone',
    },
    {
      id: 'joined_30',
      name: 'Loyal Member',
      description: 'Member for 30 days',
      icon: '🎖️',
      earned: joinedDaysAgo >= 30,
      category: 'milestone',
    },

    // Pro-only badges
    {
      id: 'pro_member',
      name: 'Pro Member',
      description: 'Upgrade to FitMind Pro',
      icon: '⭐',
      earned: plan === 'pro',
      category: 'pro',
      pro: true,
    },
  ]

  return badges
}
