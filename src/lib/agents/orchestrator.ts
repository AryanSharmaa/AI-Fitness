import Groq from 'groq-sdk'
import { SYSTEM_PROMPTS, classifyIntent, TodayContext } from './prompts'
import { UserProfile } from '@/types'

const MODEL = 'llama-3.3-70b-versatile'
let _groq: Groq | null = null
function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })
  return _groq
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

// ─── Core Groq caller ─────────────────────────────────────────────────────────
async function callGroq(systemPrompt: string, userContent: string): Promise<string> {
  const response = await getGroq().chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
  })
  return response.choices[0]?.message?.content ?? ''
}

// ─── Build conversation context string ───────────────────────────────────────
function buildConversationContext(history: AgentMessage[], limit = 6): string {
  const recent = history.slice(-limit)
  if (!recent.length) return ''
  return 'Recent conversation:\n' + recent
    .map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`)
    .join('\n')
}

// ─── Safety check ─────────────────────────────────────────────────────────────
async function runSafetyCheck(message: string): Promise<{ safe: boolean; response?: string }> {
  const safetyWords = [
    'dizzy', 'dizziness', 'chest pain', 'fainting', 'faint', 'vomit',
    'extreme fatigue', 'collapse', 'unconscious', 'bleeding', 'injury',
    'swollen', 'broken', 'fracture', 'nausea', 'nauseous',
  ]
  if (!safetyWords.some(w => message.toLowerCase().includes(w))) return { safe: true }
  const response = await callGroq(SYSTEM_PROMPTS.safety(), `User says: ${message}`)
  return { safe: false, response }
}

// ─── Critic refinement pass ───────────────────────────────────────────────────
async function refinePlanIfNeeded(
  profile: UserProfile | null,
  plan: string,
  originalRequest: string
): Promise<string> {
  const critique = await callGroq(
    SYSTEM_PROMPTS.critic(profile),
    `Original request: ${originalRequest}\n\nProposed plan:\n${plan}`
  )
  if (critique.trim().toUpperCase().startsWith('APPROVED')) return plan
  return callGroq(
    SYSTEM_PROMPTS.planner(profile),
    `Original request: ${originalRequest}\n\nPlan to revise:\n${plan}\n\nFeedback:\n${critique}`
  )
}

// ─── Memory extraction ────────────────────────────────────────────────────────
export async function extractMemory(
  userMessage: string,
  aiResponse: string
): Promise<MemoryExtract | null> {
  try {
    const raw = await callGroq(
      SYSTEM_PROMPTS.memoryExtract(),
      `User: ${userMessage}\nCoach: ${aiResponse}`
    )
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as MemoryExtract
  } catch {
    return null
  }
}

// ─── Streaming orchestrator ───────────────────────────────────────────────────
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

  // daily_plan: non-streaming with critic pass
  if (intent === 'daily_plan') {
    const draft = await callGroq(
      SYSTEM_PROMPTS.dailyPlan(input.profile, input.recentBehavior, input.todayContext || {}),
      userContent
    )
    const refined = await refinePlanIfNeeded(input.profile, draft, input.userMessage)
    onChunk(refined)
    return { agentUsed: 'daily_plan' }
  }

  const systemPrompt = (() => {
    switch (intent) {
      case 'behavior_correction': return SYSTEM_PROMPTS.behaviorCorrection(input.profile, input.recentBehavior)
      case 'food_log':            return SYSTEM_PROMPTS.foodLog(input.profile, input.userMessage)
      case 'edge_case':           return SYSTEM_PROMPTS.edgeCase(input.profile, input.userMessage, input.recentBehavior)
      case 'discipline_check':    return SYSTEM_PROMPTS.disciplineCoach(input.profile, input.recentBehavior)
      default:                    return SYSTEM_PROMPTS.main(input.profile, input.recentBehavior)
    }
  })()

  const stream = await getGroq().chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
  })

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content
    if (text) onChunk(text)
  }

  return { agentUsed: intent }
}

// ─── Non-streaming orchestrator (kept for compatibility) ─────────────────────
export async function orchestrate(input: OrchestratorInput): Promise<{
  response: string
  agentUsed: string
}> {
  const safety = await runSafetyCheck(input.userMessage)
  if (!safety.safe) return { response: safety.response || '', agentUsed: 'safety' }

  const intent = classifyIntent(input.userMessage)
  const ctx = buildConversationContext(input.history)
  const userContent = ctx
    ? `${ctx}\n\nUser's latest message: ${input.userMessage}`
    : `User: ${input.userMessage}`

  let response = ''
  let agentUsed = intent

  switch (intent) {
    case 'daily_plan': {
      const draft = await callGroq(
        SYSTEM_PROMPTS.dailyPlan(input.profile, input.recentBehavior, input.todayContext || {}),
        userContent
      )
      response = await refinePlanIfNeeded(input.profile, draft, input.userMessage)
      break
    }
    case 'behavior_correction':
      response = await callGroq(SYSTEM_PROMPTS.behaviorCorrection(input.profile, input.recentBehavior), userContent)
      break
    case 'food_log':
      response = await callGroq(SYSTEM_PROMPTS.foodLog(input.profile, input.userMessage), userContent)
      break
    case 'edge_case':
      response = await callGroq(SYSTEM_PROMPTS.edgeCase(input.profile, input.userMessage, input.recentBehavior), userContent)
      break
    case 'discipline_check':
      response = await callGroq(SYSTEM_PROMPTS.disciplineCoach(input.profile, input.recentBehavior), userContent)
      break
    default:
      response = await callGroq(SYSTEM_PROMPTS.main(input.profile, input.recentBehavior), userContent)
      agentUsed = 'main'
  }

  return { response, agentUsed }
}
