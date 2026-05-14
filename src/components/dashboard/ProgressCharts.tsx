'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Flame, Award } from 'lucide-react'

interface DailyData {
  date: string
  calories: number
  workouts: number
  protein: number
}

interface Props {
  dailyData: DailyData[]
  bestStreak: number
  currentStreak: number
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

export default function ProgressCharts({ dailyData, bestStreak, currentStreak }: Props) {
  const chartData = dailyData.map(d => ({ ...d, date: formatDate(d.date) }))
  const totalWorkouts = dailyData.reduce((s, d) => s + d.workouts, 0)
  const avgCalories = dailyData.length > 0
    ? Math.round(dailyData.reduce((s, d) => s + d.calories, 0) / dailyData.length)
    : 0
  const avgProtein = dailyData.length > 0
    ? Math.round(dailyData.reduce((s, d) => s + d.protein, 0) / dailyData.length)
    : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Progress (Last 30 Days)</h1>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard title="Current Streak" value={`${currentStreak}d`} icon={<Flame className="h-4 w-4 text-orange-500" />} />
        <SummaryCard title="Best Streak" value={`${bestStreak}d`} icon={<Award className="h-4 w-4 text-yellow-500" />} />
        <SummaryCard title="Total Workouts" value={`${totalWorkouts}`} />
        <SummaryCard title="Avg Calories/Day" value={`${avgCalories}`} />
      </div>

      {/* Calories chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Calories</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <EmptyState message="No food logs yet. Start logging meals to see your calorie trend." />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} kcal`, 'Calories']} />
                <Area type="monotone" dataKey="calories" stroke="#10b981" fill="url(#calGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Protein chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Protein (g)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <EmptyState message="No food logs yet." />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="proGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}g`, 'Protein']} />
                <Area type="monotone" dataKey="protein" stroke="#3b82f6" fill="url(#proGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Workouts chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workouts Completed</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <EmptyState message="No workouts logged yet." />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Workouts']} />
                <Bar dataKey="workouts" fill="#f97316" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground">
        Data from last 30 days. Calorie estimates are approximate based on food descriptions.
      </p>
    </div>
  )
}

function SummaryCard({ title, value, icon }: { title: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs text-muted-foreground">{title}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}
