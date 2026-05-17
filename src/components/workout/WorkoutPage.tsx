'use client'
import { useState } from 'react'
import WorkoutTracker from './WorkoutTracker'
import WorkoutHistory from './WorkoutHistory'

export default function WorkoutPage() {
  const [tab, setTab] = useState<'today' | 'history'>('today')

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1">
        {(['today', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'today' ? "Today's Workout" : 'History'}
          </button>
        ))}
      </div>

      {tab === 'today' ? <WorkoutTracker /> : <WorkoutHistory />}
    </div>
  )
}
