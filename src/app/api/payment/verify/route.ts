import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(body)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  // Activate pro plan for 30 days
  const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: 'pro',
      status: 'active',
      razorpayPaymentId: razorpay_payment_id,
      currentPeriodEnd,
    },
    update: {
      plan: 'pro',
      status: 'active',
      razorpayPaymentId: razorpay_payment_id,
      currentPeriodEnd,
    },
  })

  return NextResponse.json({ success: true })
}
