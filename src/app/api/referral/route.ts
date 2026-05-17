import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function generateCode(userId: string): string {
  const prefix = userId.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X')
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return prefix + suffix
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  let referral = await prisma.referral.findFirst({
    where: { referrerId: userId },
  })

  if (!referral) {
    let code = generateCode(userId)
    // Ensure uniqueness — retry on collision
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.referral.findUnique({ where: { code } })
      if (!existing) break
      code = generateCode(userId)
      attempts++
    }

    referral = await prisma.referral.create({
      data: {
        referrerId: userId,
        code,
      },
    })
  }

  const [usedCount, rewardedCount] = await Promise.all([
    prisma.referral.count({
      where: { referrerId: userId, usedBy: { not: null } },
    }),
    prisma.referral.count({
      where: { referrerId: userId, rewarded: true },
    }),
  ])

  const baseUrl = process.env.NEXTAUTH_URL ?? ''
  const referralUrl = `${baseUrl}/login?ref=${referral.code}`

  return NextResponse.json({
    code: referral.code,
    referralUrl,
    usedCount,
    rewardedCount,
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  const body = await req.json()
  const { action, code } = body as { action: string; code: string }

  if (action !== 'apply') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 })
  }

  const referral = await prisma.referral.findUnique({
    where: { code: code.trim().toUpperCase() },
  })

  if (!referral) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
  }

  if (referral.referrerId === userId) {
    return NextResponse.json({ error: 'You cannot use your own referral code' }, { status: 400 })
  }

  if (referral.usedBy !== null) {
    return NextResponse.json({ error: 'This referral code has already been used' }, { status: 400 })
  }

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

  // Determine new period end for each user
  async function extendPro(targetUserId: string) {
    const existing = await prisma.subscription.findUnique({ where: { userId: targetUserId } })
    const base =
      existing?.currentPeriodEnd && existing.currentPeriodEnd > new Date()
        ? existing.currentPeriodEnd
        : new Date()
    const newEnd = new Date(base.getTime() + sevenDaysMs)

    await prisma.subscription.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        plan: 'pro',
        status: 'active',
        currentPeriodEnd: newEnd,
      },
      update: {
        plan: 'pro',
        status: 'active',
        currentPeriodEnd: newEnd,
      },
    })
  }

  await Promise.all([
    extendPro(referral.referrerId),
    extendPro(userId),
    prisma.referral.update({
      where: { id: referral.id },
      data: {
        usedBy: userId,
        usedAt: new Date(),
        rewarded: true,
      },
    }),
  ])

  return NextResponse.json({ success: true, message: '7 days Pro unlocked!' })
}
