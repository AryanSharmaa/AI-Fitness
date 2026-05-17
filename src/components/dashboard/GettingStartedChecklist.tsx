'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Circle } from 'lucide-react'
import Link from 'next/link'

interface ChecklistData {
  hide: boolean
  joinedDaysAgo: number
  profileComplete: boolean
  hasFoodLog: boolean
  hasWorkoutLog: boolean
  hasStreak3: boolean
  hasChat: boolean
}

const ITEMS = [
  { key: 'profileComplete', label: 'Complete your profile', href: '/profile', desc: 'Add height, weight, and goals' },
  { key: 'hasChat', label: 'Chat with your AI coach', href: '/chat', desc: 'Ask anything to get started' },
  { key: 'hasFoodLog', label: 'Log your first meal', href: '/food-log', desc: 'Track what you eat today' },
  { key: 'hasWorkoutLog', label: 'Complete a workout', href: '/workout', desc: 'Mark a session as done' },
  { key: 'hasStreak3', label: 'Hit a 3-day streak', href: '/workout', desc: 'Log workouts 3 days in a row' },
] as const

export default function GettingStartedChecklist() {
  const [data, setData] = useState<ChecklistData | null>(null)

  useEffect(() => {
    fetch('/api/getting-started')
      .then(r => r.json())
      .then(setData)
  }, [])

  if (!data || data.hide) return null

  const completed = ITEMS.filter(i => data[i.key]).length
  const total = ITEMS.length

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Getting Started</CardTitle>
          <span className="text-xs text-muted-foreground font-medium">{completed}/{total} done</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 mt-1">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {ITEMS.map(({ key, label, href, desc }) => {
          const done = data[key]
          return (
            <Link key={key} href={done ? '#' : href} className={done ? 'pointer-events-none' : ''}>
              <div className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors ${done ? 'opacity-50' : 'hover:bg-muted/60 cursor-pointer'}`}>
                {done
                  ? <CheckCircle2 className="h-4.5 w-4.5 mt-0.5 text-emerald-500 shrink-0" style={{ width: 18, height: 18 }} />
                  : <Circle className="h-4.5 w-4.5 mt-0.5 text-muted-foreground shrink-0" style={{ width: 18, height: 18 }} />
                }
                <div>
                  <p className={`text-sm font-medium ${done ? 'line-through' : ''}`}>{label}</p>
                  {!done && <p className="text-xs text-muted-foreground">{desc}</p>}
                </div>
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
