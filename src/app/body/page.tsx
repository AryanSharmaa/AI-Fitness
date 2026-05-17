import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import BodyTracker from '@/components/body/BodyTracker'

export default async function BodyPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } })
  if (!profile?.onboardingDone) redirect('/onboarding')
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Body Tracker</h1>
      <BodyTracker />
    </div>
  )
}
