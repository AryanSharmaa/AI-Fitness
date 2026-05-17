'use client'
import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface Insight {
  type: 'nutrition' | 'workout' | 'recovery' | 'mindset'
  icon: string
  title: string
  body: string
}

interface InsightsResponse {
  insights: Insight[]
  cached: boolean
}

const TYPE_BORDER: Record<Insight['type'], string> = {
  nutrition: 'border-l-green-500',
  workout: 'border-l-orange-500',
  recovery: 'border-l-blue-500',
  mindset: 'border-l-purple-500',
}

const TYPE_BG: Record<Insight['type'], string> = {
  nutrition: 'bg-green-50 dark:bg-green-950/30',
  workout: 'bg-orange-50 dark:bg-orange-950/30',
  recovery: 'bg-blue-50 dark:bg-blue-950/30',
  mindset: 'bg-purple-50 dark:bg-purple-950/30',
}

function SkeletonRow() {
  return (
    <div className="rounded-xl border-l-4 border-l-muted bg-muted/40 p-3 space-y-2 animate-pulse">
      <div className="h-3.5 w-1/3 rounded bg-muted" />
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-4/5 rounded bg-muted" />
    </div>
  )
}

export default function InsightsFeed() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchInsights = useCallback(async (force = false) => {
    try {
      const url = force ? '/api/insights?force=1' : '/api/insights'
      const res = await fetch(url)
      if (!res.ok) return
      const data: InsightsResponse = await res.json()
      setInsights(data.insights ?? [])
    } catch {
      // silently fail — static fallback is returned from the API anyway
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void fetchInsights()
  }, [fetchInsights])

  function handleRefresh() {
    setRefreshing(true)
    void fetchInsights(true)
  }

  return (
    <div className="rounded-2xl bg-card border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          ✨ Today&apos;s Insights
        </p>
        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          aria-label="Refresh insights"
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2.5">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : insights.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No insights available right now.</p>
      ) : (
        <div className="space-y-2.5">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`rounded-xl border-l-4 ${TYPE_BORDER[insight.type]} ${TYPE_BG[insight.type]} p-3`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-base leading-none">{insight.icon}</span>
                <span className="text-sm font-semibold text-foreground">{insight.title}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug pl-6">{insight.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
