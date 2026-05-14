// Indian food meal library with bowl/roti/ladle logic
export const MEAL_LIBRARY = {
  roti: { calories: 80, protein: 3, carbs: 15, fat: 1, unit: 'roti' },
  rice_bowl: { calories: 200, protein: 4, carbs: 44, fat: 0.5, unit: 'bowl' },
  dal_bowl: { calories: 150, protein: 9, carbs: 22, fat: 3, unit: 'bowl' },
  sabzi_bowl: { calories: 120, protein: 4, carbs: 15, fat: 5, unit: 'bowl' },
  curd_bowl: { calories: 100, protein: 8, carbs: 8, fat: 4, unit: 'bowl' },
  egg: { calories: 70, protein: 6, carbs: 0.5, fat: 5, unit: 'egg' },
  chicken_curry_bowl: { calories: 280, protein: 28, carbs: 8, fat: 15, unit: 'bowl' },
  paneer_bowl: { calories: 220, protein: 14, carbs: 4, fat: 17, unit: 'bowl' },
  banana: { calories: 90, protein: 1, carbs: 23, fat: 0, unit: 'piece' },
  apple: { calories: 80, protein: 0.5, carbs: 21, fat: 0, unit: 'piece' },
  samosa: { calories: 260, protein: 5, carbs: 30, fat: 14, unit: 'piece' },
  idli: { calories: 60, protein: 2, carbs: 12, fat: 0.5, unit: 'piece' },
  dosa: { calories: 120, protein: 3, carbs: 22, fat: 3, unit: 'piece' },
  poha_bowl: { calories: 250, protein: 6, carbs: 48, fat: 5, unit: 'bowl' },
  upma_bowl: { calories: 220, protein: 5, carbs: 40, fat: 5, unit: 'bowl' },
  paratha: { calories: 180, protein: 4, carbs: 28, fat: 7, unit: 'piece' },
  chai: { calories: 60, protein: 2, carbs: 8, fat: 2, unit: 'cup' },
  milk: { calories: 120, protein: 8, carbs: 12, fat: 5, unit: 'glass' },
  protein_shake: { calories: 150, protein: 25, carbs: 8, fat: 2, unit: 'scoop' },
}

export interface ParsedMeal {
  items: Array<{ name: string; quantity: number; unit: string }>
  estimatedCalories: number
  estimatedProtein: number
  estimatedCarbs: number
  estimatedFat: number
}

export function estimateMealNutrition(description: string): ParsedMeal {
  const lower = description.toLowerCase()
  const items: ParsedMeal['items'] = []
  let totalCal = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0

  // Extract quantities with common patterns
  const patterns = [
    { regex: /(\d+)\s*roti/i, key: 'roti' },
    { regex: /(\d+)\s*chapati/i, key: 'roti' },
    { regex: /(\d+)\s*paratha/i, key: 'paratha' },
    { regex: /(\d+)\s*idli/i, key: 'idli' },
    { regex: /(\d+)\s*dosa/i, key: 'dosa' },
    { regex: /(\d+)\s*egg/i, key: 'egg' },
    { regex: /(\d+)\s*banana/i, key: 'banana' },
    { regex: /(\d+)\s*apple/i, key: 'apple' },
    { regex: /(\d+)\s*samosa/i, key: 'samosa' },
  ]

  // Keyword detection for bowls
  const bowlItems = [
    { keywords: ['rice', 'chawal'], key: 'rice_bowl' },
    { keywords: ['dal', 'lentil'], key: 'dal_bowl' },
    { keywords: ['sabzi', 'vegetable', 'curry'], key: 'sabzi_bowl' },
    { keywords: ['curd', 'dahi', 'yogurt'], key: 'curd_bowl' },
    { keywords: ['chicken'], key: 'chicken_curry_bowl' },
    { keywords: ['paneer'], key: 'paneer_bowl' },
    { keywords: ['poha'], key: 'poha_bowl' },
    { keywords: ['upma'], key: 'upma_bowl' },
    { keywords: ['chai', 'tea'], key: 'chai' },
    { keywords: ['milk', 'doodh'], key: 'milk' },
    { keywords: ['protein shake', 'whey'], key: 'protein_shake' },
  ]

  for (const { regex, key } of patterns) {
    const match = lower.match(regex)
    if (match) {
      const qty = parseInt(match[1])
      const food = MEAL_LIBRARY[key as keyof typeof MEAL_LIBRARY]
      items.push({ name: key, quantity: qty, unit: food.unit })
      totalCal += food.calories * qty
      totalProtein += food.protein * qty
      totalCarbs += food.carbs * qty
      totalFat += food.fat * qty
    }
  }

  for (const { keywords, key } of bowlItems) {
    if (keywords.some(k => lower.includes(k))) {
      const food = MEAL_LIBRARY[key as keyof typeof MEAL_LIBRARY]
      // Detect quantity words
      const qty = lower.includes('half') ? 0.5 : lower.includes('two') || lower.includes('2') ? 2 : 1
      items.push({ name: key, quantity: qty, unit: food.unit })
      totalCal += food.calories * qty
      totalProtein += food.protein * qty
      totalCarbs += food.carbs * qty
      totalFat += food.fat * qty
    }
  }

  // If nothing detected, use a rough estimate
  if (items.length === 0) {
    totalCal = 300
    totalProtein = 10
    totalCarbs = 40
    totalFat = 8
  }

  return {
    items,
    estimatedCalories: Math.round(totalCal),
    estimatedProtein: Math.round(totalProtein * 10) / 10,
    estimatedCarbs: Math.round(totalCarbs * 10) / 10,
    estimatedFat: Math.round(totalFat * 10) / 10,
  }
}

export function getDailyCalorieTarget(profile: {
  age?: number
  weight?: number
  height?: number
  gender?: string
  goal?: string
  workSchedule?: string
}): number {
  if (!profile.weight || !profile.height || !profile.age) return 1800

  // Mifflin-St Jeor BMR
  let bmr: number
  if (profile.gender === 'female') {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
  }

  // Activity multiplier
  const multiplier = profile.workSchedule === 'night' ? 1.3 : 1.4
  const tdee = bmr * multiplier

  const goalAdjustments: Record<string, number> = {
    fat_loss: -300,
    muscle: 250,
    maintenance: 0,
    discipline: 0,
  }

  const adjustment = goalAdjustments[profile.goal || 'maintenance'] || 0
  const target = Math.round(tdee + adjustment)

  // Safety minimums
  const min = profile.gender === 'female' ? 1200 : 1500
  return Math.max(target, min)
}

export function getNextMealAdjustment(
  todayLogs: Array<{ calories?: number; mealType: string }>,
  dailyTarget: number
): string {
  const consumed = todayLogs.reduce((sum, l) => sum + (l.calories || 0), 0)
  const remaining = dailyTarget - consumed
  const mealsLeft = getMealsLeft(todayLogs)

  if (mealsLeft === 0) {
    if (consumed > dailyTarget + 300) return 'You went over today. Add a 20-min walk and drink extra water. Fresh start tomorrow.'
    if (consumed < dailyTarget - 400) return 'You ate less than needed today. Have a light snack before bed — curd with fruit works well.'
    return 'Nice job today. You hit your target.'
  }

  const perMeal = Math.round(remaining / mealsLeft)

  if (remaining < 0) {
    return `You've had about ${Math.abs(remaining)} extra calories today. Keep next ${mealsLeft} meal(s) lighter — focus on protein and vegetables, skip extra carbs.`
  }

  return `About ${remaining} calories left across ${mealsLeft} meal(s). Aim for ~${perMeal} cal per meal.`
}

function getMealsLeft(logs: Array<{ mealType: string }>): number {
  const hour = new Date().getHours()
  const eaten = new Set(logs.map(l => l.mealType))
  let left = 0
  if (hour < 10 && !eaten.has('breakfast')) left++
  if (hour < 14 && !eaten.has('lunch')) left++
  if (hour < 20 && !eaten.has('dinner')) left++
  return left
}
