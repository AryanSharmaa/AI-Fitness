import { NextRequest, NextResponse } from 'next/server'
import { getAnySession } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const anySession = await getAnySession(req)
  if (!anySession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.foodLog.deleteMany({
    where: { id, userId: anySession.userId },
  })
  return NextResponse.json({ success: true })
}
