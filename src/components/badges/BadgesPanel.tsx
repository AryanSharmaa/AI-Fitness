'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Award, Lock } from 'lucide-react'
import type { Badge } from '@/lib/badges'

const CATEGORY_LABELS: Record<string, string> = {
  workout: 'Workout',
  nutrition: 'Nutrition',
  streak: 'Streaks',
  milestone: 'Milestones',
  pro: 'Pro',
}

export default function BadgesPanel() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [plan, setPlan] = useState<'free' | 'pro'>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/badges')
      .then(r => r.json())
      .then(data => {
        setBadges(data.badges || [])
        setPlan(data.plan || 'free')
      })
      .finally(() => setLoading(false))
  }, [])

  const earned = badges.filter(b => b.earned)
  const categories = [...new Set(badges.map(b => b.category))]

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-500" />
            Badges & Achievements
          </CardTitle>
          {!loading && (
            <span className="text-xs text-muted-foreground">
              {earned.length}/{badges.length} earned
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {categories.map(cat => {
              const group = badges.filter(b => b.category === cat)
              return (
                <div key={cat}>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                    {CATEGORY_LABELS[cat] || cat}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {group.map(badge => {
                      const locked = !badge.earned
                      const isPro = badge.pro && plan === 'free'
                      return (
                        <div
                          key={badge.id}
                          title={badge.description}
                          className={`relative flex flex-col items-center gap-1 p-3 rounded-lg border text-center transition-all ${
                            locked
                              ? 'opacity-40 bg-muted border-transparent'
                              : 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 shadow-sm'
                          }`}
                        >
                          <span className="text-2xl">{badge.icon}</span>
                          <span className={`text-[11px] font-medium leading-tight ${locked ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {badge.name}
                          </span>
                          {locked && (
                            <div className="absolute top-1.5 right-1.5">
                              {isPro
                                ? <span className="text-[9px] font-bold text-violet-500 bg-violet-100 dark:bg-violet-900/40 px-1 rounded">PRO</span>
                                : <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                              }
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {plan === 'free' && (
              <div className="mt-2 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 p-3 text-center">
                <p className="text-xs text-violet-700 dark:text-violet-300 font-medium">
                  Upgrade to Pro to unlock the ⭐ Pro Member badge and more features
                </p>
                <a
                  href="/upgrade"
                  className="mt-2 inline-block text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1 rounded-full transition-colors"
                >
                  Upgrade — ₹499/mo
                </a>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
