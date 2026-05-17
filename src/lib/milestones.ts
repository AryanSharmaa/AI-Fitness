export interface MilestoneDefinition {
  type: string
  title: string
  icon: string
  check: (stats: UserStats) => boolean
}

export interface UserStats {
  workoutStreak: number
  totalWorkouts: number
  totalFoodLogs: number
  weightLost: number  // kg from start weight
  calorieGoalHitDays: number
  totalWaterLogs: number
}

export const MILESTONES: MilestoneDefinition[] = [
  {
    type: 'first_workout',
    title: 'First Workout!',
    icon: '💪',
    check: (stats) => stats.totalWorkouts >= 1,
  },
  {
    type: 'streak_3',
    title: '3-Day Streak!',
    icon: '🔥',
    check: (stats) => stats.workoutStreak >= 3,
  },
  {
    type: 'streak_7',
    title: 'Week Warrior!',
    icon: '🏆',
    check: (stats) => stats.workoutStreak >= 7,
  },
  {
    type: 'streak_30',
    title: 'Iron Discipline!',
    icon: '👑',
    check: (stats) => stats.workoutStreak >= 30,
  },
  {
    type: 'workouts_10',
    title: '10 Workouts Done!',
    icon: '⚡',
    check: (stats) => stats.totalWorkouts >= 10,
  },
  {
    type: 'workouts_50',
    title: 'Fitness Veteran!',
    icon: '🎖️',
    check: (stats) => stats.totalWorkouts >= 50,
  },
  {
    type: 'first_food_log',
    title: 'First Meal Logged!',
    icon: '🥗',
    check: (stats) => stats.totalFoodLogs >= 1,
  },
  {
    type: 'food_logs_50',
    title: 'Nutrition Tracker!',
    icon: '📊',
    check: (stats) => stats.totalFoodLogs >= 50,
  },
  {
    type: 'weight_loss_2',
    title: 'Lost 2kg!',
    icon: '🎉',
    check: (stats) => stats.weightLost >= 2,
  },
  {
    type: 'weight_loss_5',
    title: 'Lost 5kg!',
    icon: '🌟',
    check: (stats) => stats.weightLost >= 5,
  },
  {
    type: 'calorie_goal_7',
    title: 'Week of Clean Eating!',
    icon: '🥦',
    check: (stats) => stats.calorieGoalHitDays >= 7,
  },
]

export function checkNewMilestones(
  stats: UserStats,
  earnedTypes: string[],
): MilestoneDefinition[] {
  return MILESTONES.filter(
    (m) => !earnedTypes.includes(m.type) && m.check(stats),
  )
}
