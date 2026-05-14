'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, AlertTriangle, Zap, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agentType?: string
  createdAt: string
}

interface TodayContext {
  sleepHours?: number
  energyLevel?: 'low' | 'medium' | 'high'
  timeAvailable?: number
  stressLevel?: 'low' | 'medium' | 'high'
}

const QUICK_ACTIONS = [
  { label: "Give me today's full plan", emoji: "📋" },
  { label: "I messed up — help me reset", emoji: "🔄" },
  { label: "Suggest today's workout", emoji: "💪" },
  { label: "I skipped my workout", emoji: "😔" },
  { label: "Festival food help", emoji: "🎉" },
  { label: "I'm burnt out, what now?", emoji: "🔥" },
  { label: "Check my discipline pattern", emoji: "📊" },
  { label: "I'm travelling today", emoji: "✈️" },
]

const AGENT_LABELS: Record<string, string> = {
  safety:             '🛡️ Safety',
  daily_plan:         '📋 Daily Plan',
  behavior_correction:'🔄 Recovery',
  food_log:           '🍱 Food',
  edge_case:          '⚡ Adapted',
  discipline_check:   '📊 Discipline',
  planner:            '📋 Plan',
  main:               '',
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const agentLabel = msg.agentType ? AGENT_LABELS[msg.agentType] : ''

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={
          isUser
            ? 'bg-primary text-primary-foreground text-xs'
            : 'bg-emerald-100 text-emerald-700 text-xs'
        }>
          {isUser ? 'You' : 'AI'}
        </AvatarFallback>
      </Avatar>
      <div className={`max-w-[80%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted rounded-tl-sm'
        }`}>
          {msg.content}
        </div>
        {agentLabel && (
          <Badge variant="outline" className="text-xs h-5">{agentLabel}</Badge>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">AI</AvatarFallback>
      </Avatar>
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ContextPanel({
  context,
  onChange,
}: {
  context: TodayContext
  onChange: (c: TodayContext) => void
}) {
  return (
    <div className="border-t bg-muted/30 px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
      {/* Sleep */}
      <div className="space-y-1">
        <label className="text-muted-foreground font-medium">Sleep last night</label>
        <div className="flex gap-1">
          {[4, 5, 6, 7, 8].map(h => (
            <button
              key={h}
              onClick={() => onChange({ ...context, sleepHours: h })}
              className={`px-1.5 py-0.5 rounded border text-xs transition-colors ${
                context.sleepHours === h
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent'
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      {/* Energy */}
      <div className="space-y-1">
        <label className="text-muted-foreground font-medium">Energy</label>
        <div className="flex gap-1">
          {(['low', 'medium', 'high'] as const).map(e => (
            <button
              key={e}
              onClick={() => onChange({ ...context, energyLevel: e })}
              className={`px-1.5 py-0.5 rounded border text-xs capitalize transition-colors ${
                context.energyLevel === e
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Time */}
      <div className="space-y-1">
        <label className="text-muted-foreground font-medium">Time available</label>
        <div className="flex gap-1">
          {[10, 20, 30, 45, 60].map(t => (
            <button
              key={t}
              onClick={() => onChange({ ...context, timeAvailable: t })}
              className={`px-1.5 py-0.5 rounded border text-xs transition-colors ${
                context.timeAvailable === t
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent'
              }`}
            >
              {t}m
            </button>
          ))}
        </div>
      </div>

      {/* Stress */}
      <div className="space-y-1">
        <label className="text-muted-foreground font-medium">Stress</label>
        <div className="flex gap-1">
          {(['low', 'medium', 'high'] as const).map(s => (
            <button
              key={s}
              onClick={() => onChange({ ...context, stressLevel: s })}
              className={`px-1.5 py-0.5 rounded border text-xs capitalize transition-colors ${
                context.stressLevel === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ChatInterface({ initialMessages = [] }: { initialMessages?: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [todayContext, setTodayContext] = useState<TodayContext>({})
  const [showContext, setShowContext] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  async function sendMessage(text?: string) {
    const messageText = text || input.trim()
    if (!messageText || streaming) return

    setInput('')
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      createdAt: new Date().toISOString(),
    }])
    setStreaming(true)
    setStreamingContent('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          todayContext: Object.keys(todayContext).length > 0 ? todayContext : undefined,
        }),
      })

      if (!response.ok || !response.body) throw new Error('Failed')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let finalAgentUsed = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.chunk) {
              accumulated += data.chunk
              setStreamingContent(accumulated)
            }
            if (data.done) {
              finalAgentUsed = data.agentUsed || ''
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: accumulated,
                agentType: finalAgentUsed,
                createdAt: new Date().toISOString(),
              }])
              setStreamingContent('')
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, connection issue. Please try again.',
        createdAt: new Date().toISOString(),
      }])
    } finally {
      setStreaming(false)
      setStreamingContent('')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const hasContext = Object.values(todayContext).some(v => v !== undefined)
  const isEmpty = messages.length === 0 && !streaming

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">
              🧠
            </div>
            <div>
              <h2 className="font-semibold text-lg">Your AI Fitness Coach</h2>
              <p className="text-muted-foreground text-sm mt-1 max-w-xs">
                Tell me what you ate, how you slept, or what you're struggling with.
                I adapt to your real life — not an ideal one.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md mt-2">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.label)}
                  className="text-left px-3 py-2.5 rounded-xl border bg-card hover:bg-accent text-sm transition-colors"
                >
                  <span className="mr-1.5">{action.emoji}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {streaming && streamingContent && (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">AI</AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[80%] whitespace-pre-wrap leading-relaxed">
              {streamingContent}
              <span className="inline-block w-0.5 h-4 bg-foreground animate-pulse ml-0.5 align-middle" />
            </div>
          </div>
        )}

        {streaming && !streamingContent && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Today context panel (collapsible) */}
      {showContext && (
        <ContextPanel context={todayContext} onChange={setTodayContext} />
      )}

      {/* Quick action bar */}
      <div className="px-4 py-1.5 flex justify-between items-center border-t bg-background">
        <button
          onClick={() => sendMessage("I messed up today — help me reset without judgment")}
          className="text-xs flex items-center gap-1 text-orange-500 hover:text-orange-600 transition-colors"
          disabled={streaming}
        >
          <AlertTriangle className="h-3 w-3" />
          I messed up
        </button>

        <button
          onClick={() => setShowContext(v => !v)}
          className={`text-xs flex items-center gap-1 transition-colors ${
            hasContext
              ? 'text-emerald-600 hover:text-emerald-700'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {showContext ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          {hasContext ? 'Context set ✓' : 'Set today\'s context'}
        </button>

        <button
          onClick={() => sendMessage("Give me a quick win I can do right now")}
          className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 transition-colors"
          disabled={streaming}
        >
          <Zap className="h-3 w-3" />
          Quick win
        </button>
      </div>

      {/* Input */}
      <div className="border-t bg-background p-4">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me what you ate, how you slept, or what happened today..."
            className="resize-none min-h-[52px] max-h-32"
            rows={1}
            disabled={streaming}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || streaming}
            size="icon-sm"
            className="h-[52px] w-[52px] shrink-0"
          >
            {streaming
              ? <RefreshCw className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />
            }
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
