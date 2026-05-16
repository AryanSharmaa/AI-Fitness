import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getUserPlan } from '@/lib/plan'
import UpgradeClient from './UpgradeClient'

export default async function UpgradePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const plan = await getUserPlan(session.user.id, session.user.email)

  return <UpgradeClient currentPlan={plan} />
}
