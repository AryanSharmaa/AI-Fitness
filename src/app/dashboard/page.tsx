import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardHome from '@/components/dashboard/DashboardHome'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap } from 'lucide-react'
import { getUserPlan } from '@/lib/plan'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } })
  if (!profile?.onboardingDone) redirect('/onboarding')

  const plan = await getUserPlan(session.user.id, session.user.email)

  return (
    <div className="min-h-screen">
      {/* Plan banner */}
      <div className="max-w-2xl mx-auto px-4 pt-3">
        {plan === 'pro' ? (
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500 text-white">Pro</Badge>
            <span className="text-xs text-muted-foreground">All features unlocked</span>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800 rounded-xl px-3 py-2">
            <p className="text-xs text-muted-foreground">Unlock AI reports, water history & more</p>
            <Button size="sm" asChild className="shrink-0 h-7 text-xs bg-orange-500 hover:bg-orange-600">
              <Link href="/upgrade"><Zap className="h-3 w-3 mr-1" />Upgrade ₹499/mo</Link>
            </Button>
          </div>
        )}
      </div>

      <DashboardHome />
    </div>
  )
}
