import { GoogleGenerativeAI } from '@google/generative-ai'
import { SYSTEM_PROMPTS, classifyIntent, TodayContext } from './prompts'
import { UserProfile } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

function getModel() {
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })
}

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface OrchestratorInput {
  userMessage: string
  history: AgentMessage[]
  profile: UserProfile | null
  recentBehavior: string
  todayContext?: TodayContext
}

export interface MemoryExtract {
  workoutCompleted: boolean | null
  workoutNotes: string | null
  mealAdherence: 'good' | 'partial' | 'poor' | null
  mealNotes: string | null
  energyLevel: 'low' | 'medium' | 'high' | null
  stressLevel: 'low' | 'medium' | 'high' | null
  sleepHours: number | null
  behaviorEvents: string[]
  deviationFromPlan: string | null
  patterns: string | null
}

// ─── Core Gemini caller ───────────────────────────────────────────────────────
async function callGemini(systemPrompt: string, userContent: string): Promise<string> {
  const model = getModel()
  const result = await model.generateContent([
    { text: `${systemPrompt}\n\n---\n\n${userContent}` },
  ])
  return result.response.text()
}

// ─── Build conversation context string ───────────────────────────────────────
function buildConversationContext(history: AgentMessage[], limit = 6): string {
  const recent = history.slice(-limit)
  if (!recent.length) return ''
  return 'Recent conversation:\n' + recent
    .map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`)
    .join('\n')
}

// ─── Safety check (runs before everything) ───────────────────────────────────
async function runSafetyCheck(message: string): Promise<{ safe: boolean; response?: string }> {
  const safetyWords = [
    'dizzy', 'dizziness', 'chest pain', 'fainting', 'faint', 'vomit',
    'extreme fatigue', 'collapse', 'unconscious', 'bleeding', 'injury',
    'swollen', 'broken', 'fracture', 'nausea', 'nauseous',
  ]
  if (!safetyWords.some(w => message.toLowerCase().includes(w))) return { safe: true }
  const response = await callGemini(SYSTEM_PROMPTS.safety(), `User says: ${message}`)
  return { safe: false, response }
}

// ─── Critic refinement pass ───────────────────────────────────────────────────
async function refinePlanIfNeeded(
  profile: UserProfile | null,
  plan: string,
  originalRequest: string
): Promise<string> {
  const critique = await callGemini(
    SYSTEM_PROMPTS.critic(profile),
    `Original request: ${originalRequest}\n\nProposed plan:\n${plan}`
  )
  if (critique.trim().toUpperCase().startsWith('APPROVED')) return plan
  return callGemini(
    SYSTEM_PROMPTS.planner(profile),
    `Original request: ${originalRequest}\n\nPlan to revise:\n${plan}\n\nFeedback:\n${critique}`
  )
}

// ─── Memory extraction (fire-and-forget after each response) ─────────────────
export async function extractMemory(
  userMessage: string,
  aiResponse: string
): Promise<MemoryExtract | null> {
  try {
    const raw = await callGemini(
      SYSTEM_PROMPTS.memoryExtract(),
      `User: ${userMessage}\nCoach: ${aiResponse}`
    )
    // Strip markdown code fences if Gemini wraps in ```json
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as MemoryExtract
  } catch {
    return null
  }
}

// ─── Main orchestrator (non-streaming) ───────────────────────────────────────
export async function orchestrate(input: OrchestratorInput): Promise<{
  response: string
  agentUsed: string
}> {
  const safety = await runSafetyCheck(input.userMessage)
  if (!safety.safe) {
    return { response: safety.response || '', agentUsed: 'safety' }
  }

  const intent = classifyIntent(input.userMessage)
  const ctx = buildConversationContext(input.history)
  const userContent = ctx
    ? `${ctx}\n\nUser's latest message: ${input.userMessage}`
    : `User: ${input.userMessage}`

  let response = ''
  let agentUsed = intent

  switch (intent) {
    case 'daily_plan': {
      const draft = await callGemini(
        SYSTEM_PROMPTS.dailyPlan(input.profile, input.recentBehavior, input.todayContext || {}),
        userContent
      )
      response = await refinePlanIfNeeded(input.profile, draft, input.userMessage)
      break
    }

    case 'behavior_correction': {
      response = await callGemini(
        SYSTEM_PROMPTS.behaviorCorrection(input.profile, input.recentBehavior),
        userContent
      )
      break
    }

    case 'food_log': {
      response = await callGemini(
        SYSTEM_PROMPTS.foodLog(input.profile, input.userMessage),
        userContent
      )
      break
    }

    case 'edge_case': {
      response = await callGemini(
        SYSTEM_PROMPTS.edgeCase(input.profile, input.userMessage, input.recentBehavior),
        userContent
      )
      break
    }

    case 'discipline_check': {
      response = await callGemini(
        SYSTEM_PROMPTS.disciplineCoach(input.profile, input.recentBehavior),
        userContent
      )
      break
    }

    default: {
      response = await callGemini(
        SYSTEM_PROMPTS.main(input.profile, input.recentBehavior),
        userContent
      )
      agentUsed = 'main'
    }
  }

  return { response, agentUsed }
}

// ─── Streaming orchestrator (used by chat API) ────────────────────────────────
export async function orchestrateStream(
  input: OrchestratorInput,
  onChunk: (chunk: string) => void
): Promise<{ agentUsed: string }> {
  const safety = await runSafetyCheck(input.userMessage)
  if (!safety.safe) {
    onChunk(safety.response || '')
    return { agentUsed: 'safety' }
  }

  const intent = classifyIntent(input.userMessage)
  const ctx = buildConversationContext(input.history)
  const userContent = ctx
    ? `${ctx}\n\nUser's latest message: ${input.userMessage}`
    : `User: ${input.userMessage}`

  // For plan-type intents that need critique, run non-streaming first pass
  // then stream the final result — prevents streaming half-baked plans
  if (intent === 'daily_plan') {
    const draft = await callGemini(
      SYSTEM_PROMPTS.dailyPlan(input.profile, input.recentBehavior, input.todayContext || {}),
      userContent
    )
    const refined = await refinePlanIfNeeded(input.profile, draft, input.userMessage)
    onChunk(refined)
    return { agentUsed: 'daily_plan' }
  }

  // All other intents stream directly
  const systemPrompt = (() => {
    switch (intent) {
      case 'behavior_correction': return SYSTEM_PROMPTS.behaviorCorrection(input.profile, input.recentBehavior)
      case 'food_log':            return SYSTEM_PROMPTS.foodLog(input.profile, input.userMessage)
      case 'edge_case':           return SYSTEM_PROMPTS.edgeCase(input.profile, input.userMessage, input.recentBehavior)
      case 'discipline_check':    return SYSTEM_PROMPTS.disciplineCoach(input.profile, input.recentBehavior)
      default:                    return SYSTEM_PROMPTS.main(input.profile, input.recentBehavior)
    }
  })()

  const model = getModel()
  const result = await model.generateContentStream([
    { text: `${systemPrompt}\n\n---\n\n${userContent}` },
  ])

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) onChunk(text)
  }

  return { agentUsed: intent }
}
