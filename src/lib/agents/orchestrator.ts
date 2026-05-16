import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPTS, classifyIntent, TodayContext } from './prompts'
import { UserProfile } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL_FAST = 'claude-haiku-4-5-20251001'
const MODEL_MAIN = 'claude-haiku-4-5-20251001'

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

// ─── Core Claude caller ───────────────────────────────────────────────────────
async function callClaude(systemPrompt: string, userContent: string): Promise<string> {
  const response = await client.messages.create({
    model: MODEL_FAST,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })
  const block = response.content[0]
  return block.type === 'text' ? block.text : ''
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
  const response = await callClaude(SYSTEM_PROMPTS.safety(), `User says: ${message}`)
  return { safe: false, response }
}

// ─── Critic refinement pass ───────────────────────────────────────────────────
async function refinePlanIfNeeded(
  profile: UserProfile | null,
  plan: string,
  originalRequest: string
): Promise<string> {
  const critique = await callClaude(
    SYSTEM_PROMPTS.critic(profile),
    `Original request: ${originalRequest}\n\nProposed plan:\n${plan}`
  )
  if (critique.trim().toUpperCase().startsWith('APPROVED')) return plan
  return callClaude(
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
    const raw = await callClaude(
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
    const draft = await callClaude(
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

  const stream = client.messages.stream({
    model: MODEL_MAIN,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      onChunk(event.delta.text)
    }
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
      const draft = await callClaude(
        SYSTEM_PROMPTS.dailyPlan(input.profile, input.recentBehavior, input.todayContext || {}),
        userContent
      )
      response = await refinePlanIfNeeded(input.profile, draft, input.userMessage)
      break
    }
    case 'behavior_correction':
      response = await callClaude(SYSTEM_PROMPTS.behaviorCorrection(input.profile, input.recentBehavior), userContent)
      break
    case 'food_log':
      response = await callClaude(SYSTEM_PROMPTS.foodLog(input.profile, input.userMessage), userContent)
      break
    case 'edge_case':
      response = await callClaude(SYSTEM_PROMPTS.edgeCase(input.profile, input.userMessage, input.recentBehavior), userContent)
      break
    case 'discipline_check':
      response = await callClaude(SYSTEM_PROMPTS.disciplineCoach(input.profile, input.recentBehavior), userContent)
      break
    default:
      response = await callClaude(SYSTEM_PROMPTS.main(input.profile, input.recentBehavior), userContent)
      agentUsed = 'main'
  }

  return { response, agentUsed }
}
