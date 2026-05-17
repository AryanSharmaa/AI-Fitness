import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ChatInterface from '@/components/chat/ChatInterface'

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } })
  if (!profile?.onboardingDone) redirect('/onboarding')

  const { topic = 'general' } = await searchParams
  const safeTopic = ['general', 'workout', 'nutrition', 'mindset'].includes(topic) ? topic : 'general'

  const recentMessages = await prisma.message.findMany({
    where: { userId: session.user.id, topic: safeTopic },
    orderBy: { createdAt: 'asc' },
    take: 30,
  })

  const messages = recentMessages.map(m => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    agentType: m.agentType || undefined,
    createdAt: m.createdAt.toISOString(),
  }))

  return <ChatInterface initialMessages={messages} initialTopic={safeTopic} />
}
