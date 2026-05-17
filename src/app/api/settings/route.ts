import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  if (action === 'clear_chat') {
    await prisma.message.deleteMany({ where: { userId } })
    return NextResponse.json({ success: true })
  }

  if (action === 'delete_all') {
    await Promise.all([
      prisma.foodLog.deleteMany({ where: { userId } }),
      prisma.workoutLog.deleteMany({ where: { userId } }),
      prisma.behaviorLog.deleteMany({ where: { userId } }),
      prisma.message.deleteMany({ where: { userId } }),
      prisma.waterLog.deleteMany({ where: { userId } }),
      prisma.bodyLog.deleteMany({ where: { userId } }),
      prisma.streak.deleteMany({ where: { userId } }),
      prisma.plan.deleteMany({ where: { userId } }),
    ])
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
