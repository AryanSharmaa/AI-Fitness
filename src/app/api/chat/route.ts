import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { orchestrateStream, extractMemory } from '@/lib/agents/orchestrator'
import { getBehaviorSummary, calculateDisciplineScore } from '@/lib/engines/behavior'
import { TodayContext } from '@/lib/agents/prompts'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  try {
    const body = await req.json()
    const { message, todayContext, topic = 'general' } = body as { message: string; todayContext?: TodayContext; topic?: string }
    const safeTopic = ['general', 'workout', 'nutrition', 'mindset'].includes(topic) ? topic : 'general'

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Load everything needed for context in parallel
    const [profile, recentMessages, behaviorLogs] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.message.findMany({
        where: { userId, topic: safeTopic },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      prisma.behaviorLog.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 30,
      }),
    ])

    const behaviorHistory = getBehaviorSummary(
      behaviorLogs.map(l => ({
        event: l.event as any,
        date: l.date,
        details: l.details || undefined,
      }))
    )

    const history = recentMessages
      .reverse()
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    // Merge todayContext with profile sleep if not provided
    const resolvedTodayContext: TodayContext = {
      sleepHours: todayContext?.sleepHours ?? profile?.sleepHours ?? undefined,
      energyLevel: todayContext?.energyLevel,
      timeAvailable: todayContext?.timeAvailable,
      stressLevel: todayContext?.stressLevel,
    }

    // Save user message
    await prisma.message.create({
      data: { userId, role: 'user', content: message, topic: safeTopic },
    })

    const encoder = new TextEncoder()
    let fullResponse = ''
    let agentUsed = 'main'

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await orchestrateStream(
            {
              userMessage: message,
              history,
              profile: profile as any,
              recentBehavior: behaviorHistory,
              todayContext: resolvedTodayContext,
            },
            (chunk) => {
              fullResponse += chunk
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`))
            }
          )
          agentUsed = result.agentUsed

          // Persist AI response
          await prisma.message.create({
            data: { userId, role: 'assistant', content: fullResponse, agentType: agentUsed, topic: safeTopic },
          })

          // Fire-and-forget: extract memory + update behavior logs in background
          extractAndPersistMemory(userId, message, fullResponse, behaviorLogs.map(l => ({
            event: l.event as any,
            date: l.date,
          }))).catch(() => {}) // never block the stream on this

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, agentUsed })}\n\n`))
          controller.close()
        } catch (err) {
          console.error('Chat stream error:', err)
          const errMsg = err instanceof Error ? err.message : 'AI error'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: `Sorry, something went wrong: ${errMsg}` })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, agentUsed: 'main' })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── Background memory extraction + persistence ──────────────────────────────
async function extractAndPersistMemory(
  userId: string,
  userMessage: string,
  aiResponse: string,
  existingBehaviorLogs: Array<{ event: any; date: Date }>
) {
  const memory = await extractMemory(userMessage, aiResponse)
  if (!memory) return

  const ops: Promise<any>[] = []

  // Persist behavior events
  for (const event of memory.behaviorEvents) {
    ops.push(
      prisma.behaviorLog.create({
        data: {
          userId,
          event,
          details: memory.deviationFromPlan || memory.patterns || undefined,
        },
      })
    )
  }

  // Update discipline score based on new full history
  const allLogs = [
    ...existingBehaviorLogs,
    ...memory.behaviorEvents.map(e => ({ event: e, date: new Date() })),
  ]
  const newScore = calculateDisciplineScore(allLogs)

  ops.push(
    prisma.userProfile.updateMany({
      where: { userId },
      data: { disciplineScore: newScore },
    })
  )

  // Update streaks
  if (memory.workoutCompleted === true) {
    const streak = await prisma.streak.findFirst({ where: { userId, type: 'workout' } })
    if (streak) {
      const newCurrent = streak.currentDays + 1
      ops.push(
        prisma.streak.update({
          where: { id: streak.id },
          data: {
            currentDays: newCurrent,
            bestDays: Math.max(streak.bestDays, newCurrent),
            lastActive: new Date(),
          },
        })
      )
    } else {
      ops.push(
        prisma.streak.create({ data: { userId, type: 'workout', currentDays: 1, bestDays: 1 } })
      )
    }
  } else if (memory.workoutCompleted === false) {
    ops.push(
      prisma.streak.updateMany({
        where: { userId, type: 'workout' },
        data: { currentDays: 0 },
      })
    )
  }

  await Promise.allSettled(ops)
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const messages = await prisma.message.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })

  return NextResponse.json(messages)
}
