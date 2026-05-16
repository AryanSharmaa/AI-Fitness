import { prisma } from './prisma'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

export async function getUserPlan(userId: string, email?: string | null): Promise<'free' | 'pro'> {
  // Admin always gets pro
  if (email && ADMIN_EMAILS.includes(email.toLowerCase())) return 'pro'

  const sub = await prisma.subscription.findUnique({ where: { userId } })
  if (!sub) return 'free'
  if (sub.plan === 'pro' && sub.status === 'active') {
    if (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date()) return 'pro'
  }
  return 'free'
}

export function isPro(plan: 'free' | 'pro') {
  return plan === 'pro'
}
