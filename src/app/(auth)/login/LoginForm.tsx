'use client'
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function LoginForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const verifyMode = searchParams.get('verify') === 'true'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(verifyMode)

  useEffect(() => {
    if (session?.user) router.push('/dashboard')
  }, [session, router])

  async function handleEmailSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await signIn('email', { email, redirect: false })
      if (res?.ok) {
        setEmailSent(true)
      } else {
        toast.error('Failed to send login link. Please try again.')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8">
            <div className="text-5xl mb-4">📬</div>
            <h2 className="font-bold text-xl mb-2">Check your email</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We sent a login link to <strong>{email}</strong>. Click the link to sign in — no password needed.
            </p>
            <Button
              variant="ghost"
              className="mt-6 text-sm"
              onClick={() => setEmailSent(false)}
            >
              Use a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
            <CardTitle>Sign in</CardTitle>
            <CardDescription>No password needed. We'll send you a magic link.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true' && (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <Separator className="flex-1" />
                </div>
              </>
            )}

            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
              <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
                {loading ? 'Sending...' : 'Send Login Link'}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center">
              By signing in, you agree to our Terms of Service. FitMind AI is not a medical service.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
