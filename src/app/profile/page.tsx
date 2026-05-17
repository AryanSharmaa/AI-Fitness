import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfileEditor from '@/components/profile/ProfileEditor'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const [profile, user] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } }),
  ])

  const initialProfile = profile
    ? {
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        gender: profile.gender,
        goal: profile.goal,
        workSchedule: profile.workSchedule,
        sleepHours: profile.sleepHours,
        foodPreference: profile.foodPreference,
        medicalNotes: profile.medicalNotes,
        equipmentAccess: profile.equipmentAccess,
        cookingSkill: profile.cookingSkill,
      }
    : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Update your details so your AI coach stays accurate.</p>
      </div>
      <ProfileEditor
        initialProfile={initialProfile}
        userEmail={session.user.email ?? ''}
        userName={user?.name ?? session.user.name ?? null}
      />
    </div>
  )
}
