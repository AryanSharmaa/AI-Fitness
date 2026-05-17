import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Bust all cached AI plans after recalibration so they regenerate with new stats
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.plan.updateMany({
    where: { userId: session.user.id, active: true },
    data: { active: false },
  })

  return NextResponse.json({ ok: true })
}
