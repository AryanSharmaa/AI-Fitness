import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWorkoutReminder, sendStreakRiskAlert } from '@/lib/email'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profiles = await prisma.userProfile.findMany({
    where: { reminderEnabled: true, onboardingDone: true },
    include: { user: { select: { email: true, name: true } } },
  })

  let sent = 0
  for (const profile of profiles) {
    if (!profile.user.email) continue
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const [streak, todayLog] = await Promise.all([
        prisma.streak.findFirst({ where: { userId: profile.userId, type: 'workout' } }),
        prisma.workoutLog.findFirst({ where: { userId: profile.userId, date: { gte: today }, completed: true } }),
      ])
      if (todayLog) continue
      const currentStreak = streak?.currentDays || 0
      if (currentStreak >= 3 && profile.reminderType === 'streak_only') {
        await sendStreakRiskAlert(profile.user.email, profile.user.name || '', currentStreak)
      } else if (profile.reminderType === 'daily') {
        await sendWorkoutReminder(profile.user.email, profile.user.name || '', currentStreak, profile.goal || '')
      }
      sent++
    } catch {}
  }

  return NextResponse.json({ sent })
}
