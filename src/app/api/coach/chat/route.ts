import { NextRequest, NextResponse } from 'next/server'
import { getAnySession } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { orchestrate } from '@/lib/agents/orchestrator'

export async function POST(req: NextRequest) {
  const anySession = await getAnySession(req)
  if (!anySession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = anySession.userId

  try {
    const { message, history = [] } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 })

    const profile = await prisma.userProfile.findUnique({ where: { userId } })

    const { response, agentUsed } = await orchestrate({
      userMessage: message,
      history: history.slice(-10),
      profile: profile as any,
      recentBehavior: [],
    })

    // Persist messages
    await prisma.message.createMany({
      data: [
        { userId, role: 'user', content: message, topic: 'general' },
        { userId, role: 'assistant', content: response, agentType: agentUsed, topic: 'general' },
      ],
    })

    return NextResponse.json({ response, agentUsed })
  } catch (err) {
    console.error('coach/chat error', err)
    return NextResponse.json(
      { response: "I'm having trouble connecting right now. Please try again in a moment." },
      { status: 200 },
    )
  }
}
