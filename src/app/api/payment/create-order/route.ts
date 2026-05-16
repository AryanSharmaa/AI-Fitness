import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const keyId = process.env.RAZORPAY_KEY_ID || ''
  const keySecret = process.env.RAZORPAY_KEY_SECRET || ''
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: 49900, // ₹499 in paise
      currency: 'INR',
      receipt: `pro_${session.user.id}_${Date.now()}`,
      notes: { userId: session.user.id, plan: 'pro' },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Razorpay create order error:', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  const order = await res.json()
  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency })
}
