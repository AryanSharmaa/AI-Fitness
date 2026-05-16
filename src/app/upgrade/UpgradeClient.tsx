'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const PRO_FEATURES = [
  'Unlimited AI coach chat',
  'Full behavior memory & pattern analysis',
  'Water tracker: 7-day history + custom goal',
  'Progress analytics (30 days)',
  'Multi-agent planning',
  'Weekly AI review report',
  'Festival & travel modes',
  'Night shift support',
  'Priority response time',
]

declare global {
  interface Window { Razorpay: any }
}

export default function UpgradeClient({ currentPlan }: { currentPlan: 'free' | 'pro' }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handlePayment() {
    setLoading(true)
    try {
      // 1. Create Razorpay order
      const orderRes = await fetch('/api/payment/create-order', { method: 'POST' })
      if (!orderRes.ok) throw new Error('Failed to create order')
      const { orderId, amount, currency } = await orderRes.json()

      // 2. Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await loadRazorpayScript()
      }

      // 3. Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'FitMind AI',
        description: 'Pro Plan — Monthly',
        order_id: orderId,
        theme: { color: '#10b981' },
        handler: async (response: any) => {
          // 4. Verify payment on backend
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          })
          if (verifyRes.ok) {
            toast.success('Welcome to Pro! 🎉')
            router.push('/dashboard')
            router.refresh()
          } else {
            toast.error('Payment verification failed. Contact support.')
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      toast.error('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  if (currentPlan === 'pro') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">You're on Pro</h1>
        <p className="text-muted-foreground mb-6">All features are unlocked. Keep crushing it.</p>
        <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
      </div>
    )
  }

  return (
    <>
      {/* Load Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Badge className="mb-3 bg-emerald-500">Upgrade to Pro</Badge>
          <h1 className="text-3xl font-bold mb-2">Unlock everything</h1>
          <p className="text-muted-foreground">Less than a protein shake per day.</p>
        </div>

        <Card className="border-emerald-500 border-2">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-bold">₹499</span>
              <span className="text-muted-foreground mb-1">/month</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">~₹16/day · Cancel anytime</p>

            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base"
              onClick={handlePayment}
              disabled={loading}
            >
              <Zap className="h-4 w-4 mr-2" />
              {loading ? 'Opening payment...' : 'Pay ₹499 — Upgrade Now'}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              Secured by Razorpay · UPI, Cards, Net Banking, Wallets
            </p>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground mt-6">
          FitMind AI is not a medical service. Always consult a doctor for medical decisions.
        </p>
      </div>
    </>
  )
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay'))
    document.head.appendChild(script)
  })
}
