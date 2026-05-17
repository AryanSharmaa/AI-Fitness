import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OnboardingForm from '@/components/onboarding/OnboardingForm'

export default async function RecalibratePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } })
  if (!profile?.onboardingDone) redirect('/onboarding')

  return (
    <OnboardingForm
      mode="recalibrate"
      initialData={profile ? {
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        goalWeight: profile.goalWeight,
        gender: profile.gender,
        goal: profile.goal,
        workSchedule: profile.workSchedule,
        sleepHours: profile.sleepHours,
        foodPreference: profile.foodPreference,
        medicalNotes: profile.medicalNotes,
        equipmentAccess: profile.equipmentAccess,
        cookingSkill: profile.cookingSkill,
      } : null}
    />
  )
}
