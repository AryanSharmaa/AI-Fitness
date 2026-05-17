// Utility to interpolate {{vars}} into prompt templates
export function buildPrompt(template: string, vars: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''))
}

// Recommended model routing per feature
export const MODEL_ROUTES = {
  orchestrator: 'anthropic/claude-haiku-4-5',
  planner: 'anthropic/claude-sonnet-4-6',
  nutrition: 'anthropic/claude-sonnet-4-6',
  safety: 'anthropic/claude-sonnet-4-6',
  foodParser: 'anthropic/claude-haiku-4-5',
  foodPhoto: 'anthropic/claude-sonnet-4-6',
  recovery: 'anthropic/claude-haiku-4-5',
  monthlyReport: 'anthropic/claude-sonnet-4-6',
  weeklyPlan: 'anthropic/claude-sonnet-4-6',
  emailCopy: 'anthropic/claude-haiku-4-5',
} as const

// OpenRouter free fallback chain (used when paid models not available)
export const FREE_FALLBACK_CHAIN = [
  'deepseek/deepseek-chat-v3-0324:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'mistralai/mistral-7b-instruct:free',
]

// ─── 2.1 Food Text Parser ────────────────────────────────────────────────────
export const FOOD_PARSER_PROMPT = `You are a nutrition database for an Indian fitness app. Parse the user's meal description and return structured macro data.

User food preference: {{foodPreference}}
User calorie target: {{targetKcal}} kcal/day

User input: "{{mealDescription}}"

Return JSON only, no explanation:
{
  "items": [
    {
      "name": "string (common name)",
      "quantity": number,
      "unit": "g|ml|piece|cup|bowl|tbsp|scoop",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "fibre_g": number
    }
  ],
  "totals": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "fibre_g": number
  },
  "confidence": "high|medium|low",
  "notes": "string|null (flag if portion was ambiguous)"
}

Rules:
- Use standard Indian serving sizes (1 medium roti = 40g, 1 bowl dal = 200ml)
- If item is ambiguous (e.g. "biryani"), assume a standard restaurant portion
- If multiple quantities are implied ("2 rotis and dal"), split into separate items
- Round all numbers to 1 decimal place
- If confidence is low, set notes to explain why`

// ─── 2.2 Food Photo Vision Parser ────────────────────────────────────────────
export const FOOD_PHOTO_PROMPT = `You are a nutrition analyst. The user has shared a photo of their meal.

User food preference: {{foodPreference}}

Analyse the image and identify all visible food items. Estimate portions based on visual cues (plate size, hand scale, container size if visible).

Return JSON only:
{
  "detected_items": [
    {
      "name": "string",
      "estimated_quantity": number,
      "unit": "g|ml|piece|cup|bowl",
      "confidence": "high|medium|low",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "fibre_g": number
    }
  ],
  "totals": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "fibre_g": number
  },
  "overall_confidence": "high|medium|low",
  "notes": "string (mention anything obscured, mixed dishes, or uncertain items)"
}

Important: Always show editable fields to the user after parsing. Never auto-save without user confirmation.`

// ─── 4.1 Smart Meal Suggestions (remaining macros) ────────────────────────────
export const MEAL_SUGGESTION_PROMPT = `You are a meal planning assistant for an Indian fitness app.

User has already eaten today:
{{todayFoodLog}}

Remaining for today:
- Calories: {{remainingKcal}} kcal
- Protein: {{remainingProtein}}g
- Carbs: {{remainingCarbs}}g
- Fat: {{remainingFat}}g

User preferences:
- Food type: {{foodPreference}} (veg/non-veg/vegan/eggetarian)
- Time of day: {{timeOfDay}} (suggest appropriate meal — breakfast/lunch/snack/dinner)

Suggest 3 meal options that fit within the remaining macros.
Prioritise Indian foods. Include quick-prep options (<20 mins).

Return JSON only:
[{
  "meal": "Breakfast|Lunch|Dinner|Snack",
  "suggestion": "specific dish name",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "reason": "why this fits their remaining macros (1 sentence)"
}]`

// ─── 5.1 Daily AI Insights ────────────────────────────────────────────────────
export const INSIGHTS_PROMPT = `You are a data analyst and coach for a fitness app. Generate 3 personalised insights for this user based on their data from the past 7 days.

User data summary:
- Goal: {{goal}} | Discipline score: {{disciplineScore}}/100
- Avg daily calories: {{avgKcal}} vs target {{targetKcal}}
- Avg protein: {{avgProtein}}g vs goal {{proteinGoal}}g
- Workouts completed: {{weeklyWorkoutsDone}}/{{weeklyWorkoutsTarget}}
- Avg mood: {{avgMood}}/5 | Avg energy: {{avgEnergy}}/5
- Current streak: {{streak}} days

Generate exactly 3 insights. Each must be:
1. Specific to this user's data — never generic
2. Actionable — tell them what to do with the information
3. Positive in framing — even for negative trends

Return JSON only:
{
  "insights": [
    {
      "type": "nutrition|workout|recovery|mindset",
      "icon": "emoji",
      "title": "string (max 8 words)",
      "body": "string (2 sentences, specific and actionable)"
    }
  ]
}`

// ─── 9.1 Weekly AI Plan ───────────────────────────────────────────────────────
export const WEEKLY_PLAN_PROMPT = `You are a professional Indian fitness and nutrition coach. Generate a personalized 7-day plan.

USER PROFILE:
- Goal: {{goal}}
- Age: {{age}}, Gender: {{gender}}
- Height: {{height}}cm, Weight: {{weight}}kg
- Equipment: {{equipment}}
- Food preference: {{foodPreference}}
- Sleep: {{sleepHours}} hrs/night
- Schedule: {{workSchedule}}
- Medical notes: {{medicalNotes}}
- Discipline score: {{disciplineScore}}/100

RECENT ACTIVITY (last 2 weeks):
- Workout completion rate: {{completionRate}}%
- Current workout streak: {{workoutStreak}} days
- Avg daily calories logged: {{avgCalories}} kcal
- Recent workout types: {{recentWorkoutTypes}}

Return ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "generatedAt": "{{generatedAt}}",
  "summary": "2-sentence personalized summary of this week's plan and why",
  "days": [
    {
      "day": "Monday",
      "workout": "specific workout description with duration",
      "meals": {
        "breakfast": "specific Indian meal",
        "lunch": "specific Indian meal",
        "dinner": "specific Indian meal",
        "snack": "specific snack"
      }
    }
  ]
}
Include all 7 days (Monday through Sunday). Keep workouts realistic for the user's equipment and discipline score. Focus on Indian foods.`

// ─── Safety agent India-specific helplines ────────────────────────────────────
export const SAFETY_HELPLINES = {
  mentalHealth: 'iCall (India): 9152987821 | Vandrevala Foundation: 1860-2662-345',
  eatingDisorder: 'NIMHANS helpline: 080-46110007',
}
