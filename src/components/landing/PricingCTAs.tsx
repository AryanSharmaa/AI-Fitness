'use client'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function FreePricingCTA() {
  const { data: session } = useSession()
  const href = session?.user ? '/dashboard' : '/login'
  const label = session?.user ? 'Go to Dashboard' : 'Get Started'
  return (
    <Button variant="outline" className="w-full" asChild>
      <Link href={href}>{label}</Link>
    </Button>
  )
}

export function ProPricingCTA() {
  const { data: session } = useSession()
  const href = session?.user ? '/upgrade' : '/login'
  const label = session?.user ? 'Upgrade to Pro →' : 'Start Free Trial'
  return (
    <Button className="w-full" asChild>
      <Link href={href}>{label}</Link>
    </Button>
  )
}

export function BottomCTA() {
  const { data: session } = useSession()
  const href = session?.user ? '/dashboard' : '/login'
  const label = session?.user ? 'Go to Dashboard →' : 'Start Free →'
  return (
    <Button size="lg" variant="secondary" asChild className="text-base px-8">
      <Link href={href}>{label}</Link>
    </Button>
  )
}
