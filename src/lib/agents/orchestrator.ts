import OpenAI from 'openai'
import { SYSTEM_PROMPTS, classifyIntent, TodayContext } from './prompts'
import { UserProfile } from '@/types'

// Ordered fallback list — tried in sequence on 429/404
const MODELS = [
  'deepseek/deepseek-v4-flash:free',
  'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'openai/gpt-oss-20b:free',
  'openrouter/free',  // OpenRouter auto-router — always works
]

let _client: OpenAI | null = null
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY || '',
    })
  }
  return _client
}

async function callWithFallback(
  messages: { role: 'system' | 'user'; content: string }[],
  maxTokens: number,
  stream: false
): Promise<string>
async function callWithFallback(
  messages: { role: 'system' | 'user'; content: string }[],
  maxTokens: number,
  stream: true
): Promise<AsyncIterable<any>>
async function callWithFallback(
  messages: { role: 'system' | 'user'; content: string }[],
  maxTokens: number,
  stream: boolean
): Promise<string | AsyncIterable<any>> {
  let lastError: any
  for (const model of MODELS) {
    try {
      if (stream) {
        return await getClient().chat.completions.create({
          model,
          max_tokens: maxTokens,
          stream: true,
          messages,
        }) as any
      } else {
        const res = await getClient().chat.completions.create({
          model,
          max_tokens: maxTokens,
          stream: false,
          messages,
        })
        return res.choices[0]?.message?.content ?? ''
      }
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status
      if (status === 429 || status === 404 || status === 503) {
        lastError = err
        continue
      }
      throw err
    }
  }
  throw lastError
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

// ─── Core caller ──────────────────────────────────────────────────────────────
async function callAI(systemPrompt: string, userContent: string, maxTokens = 800): Promise<string> {
  return callWithFallback(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
    maxTokens,
    false
  )
}

// ─── Build conversation context string ───────────────────────────────────────
function buildConversationContext(history: AgentMessage[], limit = 4): string {
  const recent = history.slice(-limit)
  if (!recent.length) return ''
  return 'Recent conversation:\n' + recent
    .map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`)
    .join('\n')
}

// ─── Safety check — keyword only, zero API calls ──────────────────────────────
const SAFETY_WORDS = [
  'dizzy', 'dizziness', 'chest pain', 'fainting', 'faint', 'vomit',
  'extreme fatigue', 'collapse', 'unconscious', 'bleeding', 'injury',
  'swollen', 'broken', 'fracture', 'nausea', 'nauseous',
]
const SAFETY_RESPONSE = '⚠️ Please stop your activity immediately, sit down, and rest. If symptoms persist or feel serious, please see a doctor right away. Your health comes first — no workout is worth risking it.'

function runSafetyCheck(message: string): { safe: boolean; response?: string } {
  if (SAFETY_WORDS.some(w => message.toLowerCase().includes(w))) {
    return { safe: false, response: SAFETY_RESPONSE }
  }
  return { safe: true }
}

// ─── Memory extraction (lightweight, best-effort) ─────────────────────────────
export async function extractMemory(
  userMessage: string,
  aiResponse: string
): Promise<MemoryExtract | null> {
  try {
    const raw = await callAI(
      SYSTEM_PROMPTS.memoryExtract(),
      `User: ${userMessage}\nCoach: ${aiResponse}`,
      256
    )
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as MemoryExtract
  } catch {
    return null
  }
}

// ─── Streaming orchestrator — 1 API call per message ─────────────────────────
export async function orchestrateStream(
  input: OrchestratorInput,
  onChunk: (chunk: string) => void
): Promise<{ agentUsed: string }> {
  const safety = runSafetyCheck(input.userMessage)
  if (!safety.safe) {
    onChunk(safety.response!)
    return { agentUsed: 'safety' }
  }

  const intent = classifyIntent(input.userMessage)
  const ctx = buildConversationContext(input.history)
  const userContent = ctx
    ? `${ctx}\n\nUser's latest message: ${input.userMessage}`
    : `User: ${input.userMessage}`

  const systemPrompt = (() => {
    switch (intent) {
      case 'daily_plan':          return SYSTEM_PROMPTS.dailyPlan(input.profile, input.recentBehavior, input.todayContext || {})
      case 'behavior_correction': return SYSTEM_PROMPTS.behaviorCorrection(input.profile, input.recentBehavior)
      case 'food_log':            return SYSTEM_PROMPTS.foodLog(input.profile, input.userMessage)
      case 'edge_case':           return SYSTEM_PROMPTS.edgeCase(input.profile, input.userMessage, input.recentBehavior)
      case 'discipline_check':    return SYSTEM_PROMPTS.disciplineCoach(input.profile, input.recentBehavior)
      default:                    return SYSTEM_PROMPTS.main(input.profile, input.recentBehavior)
    }
  })()

  const stream = await callWithFallback(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
    800,
    true
  )

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
  const safety = runSafetyCheck(input.userMessage)
  if (!safety.safe) return { response: safety.response!, agentUsed: 'safety' }

  const intent = classifyIntent(input.userMessage)
  const ctx = buildConversationContext(input.history)
  const userContent = ctx
    ? `${ctx}\n\nUser's latest message: ${input.userMessage}`
    : `User: ${input.userMessage}`

  const systemPrompt = (() => {
    switch (intent) {
      case 'daily_plan':          return SYSTEM_PROMPTS.dailyPlan(input.profile, input.recentBehavior, input.todayContext || {})
      case 'behavior_correction': return SYSTEM_PROMPTS.behaviorCorrection(input.profile, input.recentBehavior)
      case 'food_log':            return SYSTEM_PROMPTS.foodLog(input.profile, input.userMessage)
      case 'edge_case':           return SYSTEM_PROMPTS.edgeCase(input.profile, input.userMessage, input.recentBehavior)
      case 'discipline_check':    return SYSTEM_PROMPTS.disciplineCoach(input.profile, input.recentBehavior)
      default:                    return SYSTEM_PROMPTS.main(input.profile, input.recentBehavior)
    }
  })()

  const response = await callAI(systemPrompt, userContent)
  return { response, agentUsed: intent }
}
