'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Download,
  UtensilsCrossed,
  Dumbbell,
  Scale,
  Heart,
  Loader2,
} from 'lucide-react'

type ExportType = 'food' | 'workout' | 'body' | 'mood'

interface ExportCard {
  type: ExportType
  label: string
  description: string
  filename: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  buttonClass: string
}

const EXPORT_CARDS: ExportCard[] = [
  {
    type: 'food',
    label: 'Food Logs',
    description: 'All meals, calories & macros',
    filename: 'fitmind_food_export.csv',
    icon: UtensilsCrossed,
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
    buttonClass:
      'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white border-transparent',
  },
  {
    type: 'workout',
    label: 'Workout Logs',
    description: 'All workouts, duration & calories',
    filename: 'fitmind_workout_export.csv',
    icon: Dumbbell,
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    buttonClass:
      'bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600 text-white border-transparent',
  },
  {
    type: 'body',
    label: 'Body Measurements',
    description: 'Weight, waist, chest, arms, hips',
    filename: 'fitmind_body_export.csv',
    icon: Scale,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    buttonClass:
      'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white border-transparent',
  },
  {
    type: 'mood',
    label: 'Mood & Energy',
    description: 'Daily mood and energy scores',
    filename: 'fitmind_mood_export.csv',
    icon: Heart,
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    buttonClass:
      'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white border-transparent',
  },
]

async function downloadCSV(type: ExportType, filename: string): Promise<void> {
  const res = await fetch(`/api/export?type=${type}`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? 'Export failed')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ExportPage() {
  const [loading, setLoading] = useState<Record<ExportType | 'all', boolean>>({
    food: false,
    workout: false,
    body: false,
    mood: false,
    all: false,
  })

  async function handleDownload(type: ExportType, filename: string) {
    setLoading(prev => ({ ...prev, [type]: true }))
    try {
      await downloadCSV(type, filename)
      toast.success(`${filename} downloaded successfully`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }))
    }
  }

  async function handleDownloadAll() {
    setLoading(prev => ({ ...prev, all: true }))
    let anyError = false
    for (const card of EXPORT_CARDS) {
      try {
        await downloadCSV(card.type, card.filename)
      } catch {
        anyError = true
        toast.error(`Failed to download ${card.label}`)
      }
    }
    if (!anyError) {
      toast.success('All data exported successfully')
    }
    setLoading(prev => ({ ...prev, all: false }))
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Download className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Export Your Data</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Download your fitness data as CSV files — compatible with Excel, Google Sheets, and more.
        </p>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EXPORT_CARDS.map(card => {
          const Icon = card.icon
          const isLoading = loading[card.type]

          return (
            <div
              key={card.type}
              className="rounded-2xl border bg-card p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-full p-2.5 ${card.iconBg} shrink-0`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <div>
                  <h2 className="font-semibold text-base">{card.label}</h2>
                  <p className="text-muted-foreground text-sm mt-0.5">{card.description}</p>
                </div>
              </div>

              <Button
                className={`w-full mt-auto ${card.buttonClass}`}
                disabled={isLoading || loading.all}
                onClick={() => handleDownload(card.type, card.filename)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Downloading…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download CSV
                  </>
                )}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Export All */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-base">Export All Data</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Download all four CSV files at once — food, workout, body, and mood logs.
            </p>
          </div>
          <Button
            size="lg"
            disabled={Object.values(loading).some(Boolean)}
            onClick={handleDownloadAll}
            className="shrink-0"
          >
            {loading.all ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export All
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
