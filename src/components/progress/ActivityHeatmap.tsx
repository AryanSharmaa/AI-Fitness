'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'

interface Props {
  workoutLogs: { date: string; completed: boolean }[]
  foodLogs: { date: string }[]
}

export default function ActivityHeatmap({ workoutLogs, foodLogs }: Props) {
  const today = new Date()
  // Build 52 weeks back from today
  const weeks: (Date | null)[][] = []
  const startDay = new Date(today)
  startDay.setDate(startDay.getDate() - 363) // ~52 weeks
  // Align to Sunday
  startDay.setDate(startDay.getDate() - startDay.getDay())

  const workoutDates = new Set(
    workoutLogs.filter(l => l.completed).map(l => l.date.split('T')[0])
  )
  const foodDates = new Set(foodLogs.map(l => l.date.split('T')[0]))

  let week: (Date | null)[] = []
  const cursor = new Date(startDay)
  while (cursor <= today) {
    if (week.length === 7) { weeks.push(week); week = [] }
    week.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  while (week.length < 7) week.push(null)
  weeks.push(week)

  function getLevel(date: Date | null): 0 | 1 | 2 | 3 {
    if (!date) return 0
    const key = date.toISOString().split('T')[0]
    const hasWorkout = workoutDates.has(key)
    const hasFood = foodDates.has(key)
    if (hasWorkout && hasFood) return 3
    if (hasWorkout || hasFood) return 2
    if (date > today) return 0
    // past day with no activity — dim
    const diffDays = Math.floor((today.getTime() - date.getTime()) / 86400000)
    return diffDays < 30 ? 1 : 0
  }

  const COLORS = [
    'bg-muted',
    'bg-emerald-100 dark:bg-emerald-950',
    'bg-emerald-300 dark:bg-emerald-700',
    'bg-emerald-500 dark:bg-emerald-500',
  ]
  const TOOLTIPS = ['No activity', 'Some activity', 'Active day', 'Full day — workout + food logged']

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  // Build month labels
  const monthLabels: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const first = week.find(d => d !== null)
    if (first && first.getMonth() !== lastMonth) {
      lastMonth = first.getMonth()
      monthLabels.push({ label: MONTHS[first.getMonth()], col: wi })
    }
  })

  const totalActive = workoutDates.size + foodDates.size > 0
    ? new Set([...workoutDates, ...foodDates]).size
    : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            Activity Heatmap
          </CardTitle>
          <span className="text-xs text-muted-foreground">{totalActive} active days this year</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Month labels */}
            <div className="flex mb-1" style={{ paddingLeft: '1.5rem' }}>
              {monthLabels.map(({ label, col }) => (
                <div
                  key={`${label}-${col}`}
                  className="text-xs text-muted-foreground absolute"
                  style={{ marginLeft: `${col * 13}px` }}
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="h-4" /> {/* spacer for month labels */}

            {/* Grid */}
            <div className="flex gap-[3px]">
              {/* Day labels */}
              <div className="flex flex-col gap-[3px] mr-1">
                {['', 'M', '', 'W', '', 'F', ''].map((d, i) => (
                  <div key={i} className="h-[11px] w-3 text-[9px] text-muted-foreground flex items-center">
                    {d}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => {
                    const level = getLevel(day)
                    const isToday = day?.toISOString().split('T')[0] === today.toISOString().split('T')[0]
                    return (
                      <div
                        key={di}
                        title={day ? `${day.toDateString()}: ${TOOLTIPS[level]}` : ''}
                        className={`h-[11px] w-[11px] rounded-sm transition-colors ${
                          day ? COLORS[level] : 'bg-transparent'
                        } ${isToday ? 'ring-1 ring-emerald-500' : ''}`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1 mt-3 justify-end">
              <span className="text-xs text-muted-foreground mr-1">Less</span>
              {COLORS.map((c, i) => (
                <div key={i} className={`h-[11px] w-[11px] rounded-sm ${c}`} />
              ))}
              <span className="text-xs text-muted-foreground ml-1">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
