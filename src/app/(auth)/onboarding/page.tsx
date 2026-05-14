import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OnboardingForm from '@/components/onboarding/OnboardingForm'

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (profile?.onboardingDone) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-background dark:from-emerald-950/10">
      <div className="text-center pt-8 pb-2">
        <h1 className="text-2xl font-bold">Let's set up your profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Takes 2 minutes. The more you share, the smarter your coach gets.
        </p>
      </div>
      <OnboardingForm />
    </div>
  )
}
