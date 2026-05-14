'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to send code')
        return
      }
      setStep('otp')
      toast.success('Check your email for the 6-digit code')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!otp.trim()) return
    setLoading(true)
    try {
      const res = await signIn('otp', {
        email,
        otp,
        redirect: false,
        callbackUrl: '/dashboard',
      })
      if (res?.ok && !res?.error) {
        router.push('/dashboard')
      } else {
        toast.error('Invalid or expired code. Please try again.')
        setOtp('')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-emerald-50/50 to-background dark:from-emerald-950/10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">FitMind AI</h1>
          <p className="text-muted-foreground mt-1 text-sm">Your adaptive Indian fitness coach</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{step === 'email' ? 'Sign in' : 'Enter your code'}</CardTitle>
            <CardDescription>
              {step === 'email'
                ? 'Enter your email — we\'ll send a 6-digit code.'
                : `We sent a code to ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'email' ? (
              <form onSubmit={handleSendOTP} className="space-y-3">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
                <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
                  {loading ? 'Sending...' : 'Send Code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-3">
                <Input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoFocus
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                />
                <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                  {loading ? 'Verifying...' : 'Sign In'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => { setStep('email'); setOtp('') }}
                >
                  Use a different email
                </Button>
              </form>
            )}
            <p className="text-xs text-muted-foreground text-center mt-4">
              By signing in, you agree to our Terms. FitMind AI is not a medical service.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
