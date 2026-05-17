import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfileEditor from '@/components/profile/ProfileEditor'
import Link from 'next/link'
import { ChevronLeft, RefreshCcw } from 'lucide-react'

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

      {/* Recalibrate CTA */}
      <Link href="/recalibrate" className="block group">
        <div className="rounded-2xl border-2 border-dashed border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/20 p-5 flex items-center gap-4 hover:border-orange-400 dark:hover:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-all">
          <div className="h-11 w-11 rounded-xl bg-orange-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <RefreshCcw className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">Recalibrate your goals</p>
            <p className="text-xs text-muted-foreground mt-0.5">Lost weight? Changed your goal? Walk through setup again to recalculate your calorie target, macros, and AI plan.</p>
          </div>
          <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-180 shrink-0" />
        </div>
      </Link>
    </div>
  )
}
