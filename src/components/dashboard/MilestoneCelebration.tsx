'use client'
import { useEffect, useState } from 'react'

interface NewMilestone {
  type: string
  title: string
  icon: string
}

export default function MilestoneCelebration() {
  const [queue, setQueue] = useState<NewMilestone[]>([])
  const [current, setCurrent] = useState<NewMilestone | null>(null)
  const [totalEarned, setTotalEarned] = useState<number>(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch('/api/milestones', { method: 'POST' })
      .then((r) => r.json())
      .then((data: { newMilestones: NewMilestone[] }) => {
        if (data.newMilestones?.length > 0) {
          setQueue(data.newMilestones)
        }
      })
      .catch(() => {/* silent */})

    fetch('/api/milestones')
      .then((r) => r.json())
      .then((data: { total: number }) => {
        setTotalEarned(data.total ?? 0)
      })
      .catch(() => {/* silent */})
  }, [])

  // When queue changes, show next milestone
  useEffect(() => {
    if (queue.length > 0 && !current) {
      setCurrent(queue[0])
      setQueue((q) => q.slice(1))
      // Small delay to allow DOM paint before animating in
      setTimeout(() => setVisible(true), 30)
    }
  }, [queue, current])

  function dismiss() {
    setVisible(false)
    // Wait for fade-out before clearing current and showing next
    setTimeout(() => {
      setCurrent(null)
    }, 300)
  }

  if (!current) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={dismiss}
      />

      {/* Modal card */}
      <div
        className={`relative bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-2xl text-center max-w-sm w-full mx-4 transition-transform duration-300 ${
          visible ? 'scale-100' : 'scale-90'
        }`}
      >
        {/* Giant emoji */}
        <div className="text-6xl mb-4 animate-bounce inline-block">
          {current.icon}
        </div>

        {/* Subtitle */}
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
          Milestone unlocked!
        </p>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-6">
          {current.title}
        </h2>

        {/* Total badges badge */}
        {totalEarned > 0 && (
          <p className="text-xs text-muted-foreground mb-4">
            You now have {totalEarned} milestone{totalEarned !== 1 ? 's' : ''} total
          </p>
        )}

        <button
          onClick={dismiss}
          className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors"
        >
          Awesome!
        </button>
      </div>
    </div>
  )
}
