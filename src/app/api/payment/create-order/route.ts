import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
})

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const order = await razorpay.orders.create({
    amount: 49900, // ₹499 in paise
    currency: 'INR',
    receipt: `pro_${session.user.id}_${Date.now()}`,
    notes: { userId: session.user.id, plan: 'pro' },
  })

  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency })
}
