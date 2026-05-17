import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { reminderEnabled: true, reminderTime: true, reminderType: true },
  })

  return NextResponse.json({
    reminderEnabled: profile?.reminderEnabled ?? false,
    reminderTime: profile?.reminderTime ?? '08:00',
    reminderType: profile?.reminderType ?? 'daily',
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reminderEnabled, reminderTime, reminderType } = await req.json()

  await prisma.userProfile.update({
    where: { userId: session.user.id },
    data: { reminderEnabled, reminderTime, reminderType },
  })

  return NextResponse.json({ success: true })
}
