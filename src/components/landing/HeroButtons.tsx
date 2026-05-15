'use client'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HeroButtons() {
  const { data: session } = useSession()

  if (session?.user) {
    return (
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button size="lg" asChild className="text-base px-8">
          <Link href="/dashboard">Go to Dashboard →</Link>
        </Button>
        <Button size="lg" variant="outline" asChild className="text-base px-8">
          <Link href="/chat">Open AI Coach</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Button size="lg" asChild className="text-base px-8">
        <Link href="/login">Start Free →</Link>
      </Button>
      <Button size="lg" variant="outline" asChild className="text-base px-8">
        <Link href="/chat">Try AI Demo</Link>
      </Button>
    </div>
  )
}
