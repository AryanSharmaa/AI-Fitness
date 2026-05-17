'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Zap } from 'lucide-react'

interface RecoveryResult {
  score: number
  label: string
  color: string
  advice: string
  suggestedIntensity: string
}

const INTENSITY_LABELS: Record<string, string> = {
  rest: 'Rest day',
  light: 'Light activity',
  moderate: 'Moderate training',
  high: 'High intensity',
}

export default function RecoveryCard() {
  const [data, setData] = useState<RecoveryResult | null>(null)

  useEffect(() => {
    fetch('/api/recovery').then(r => r.json()).then(setData)
  }, [])

  if (!data) return <div className="h-24 bg-muted animate-pulse rounded-xl" />

  const pct = data.score / 100
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-4">
          {/* Arc gauge */}
          <div className="relative shrink-0">
            <svg width="72" height="72" className="-rotate-90">
              <circle cx="36" cy="36" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle
                cx="36" cy="36" r={r} fill="none"
                stroke={data.color} strokeWidth="8"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round" className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold leading-none">{data.score}</span>
              <span className="text-[9px] text-muted-foreground">/ 100</span>
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Zap className="h-3.5 w-3.5" style={{ color: data.color }} />
              <span className="text-sm font-semibold" style={{ color: data.color }}>{data.label} Recovery</span>
            </div>
            <p className="text-xs text-muted-foreground leading-snug">{data.advice}</p>
            <span className="inline-block mt-1.5 text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              Suggested: {INTENSITY_LABELS[data.suggestedIntensity]}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
