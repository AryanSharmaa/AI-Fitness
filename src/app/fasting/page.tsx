import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import FastingTracker from '@/components/fasting/FastingTracker'
import MoodCheckIn from '@/components/dashboard/MoodCheckIn'

export default async function FastingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } })
  if (!profile?.onboardingDone) redirect('/onboarding')

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Fasting & Mood</h1>
      <MoodCheckIn />
      <FastingTracker />
    </div>
  )
}
