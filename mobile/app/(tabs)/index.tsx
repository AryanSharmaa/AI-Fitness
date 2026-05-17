import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface DashboardData {
  calories: { consumed: number; goal: number }
  macros: { protein: number; carbs: number; fat: number }
  streak: number
  completedWorkouts: number
  recentLogs: Array<{ id: string; food: string; calories: number; time: string }>
}

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <View className="flex-1">
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs text-zinc-500 dark:text-zinc-400">{label}</Text>
        <Text className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{value}g</Text>
      </View>
      <View className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <View className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </View>
    </View>
  )
}

export default function DashboardTab() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  const { data, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => apiFetch('/api/dashboard'),
    placeholderData: {
      calories: { consumed: 0, goal: 2000 },
      macros: { protein: 0, carbs: 0, fat: 0 },
      streak: 0,
      completedWorkouts: 0,
      recentLogs: [],
    },
  })

  async function onRefresh() {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const calPct = Math.min(((data?.calories.consumed ?? 0) / (data?.calories.goal ?? 2000)) * 100, 100)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
      >
        <View className="px-5 pt-4 pb-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-zinc-500 dark:text-zinc-400 text-sm">{greeting()},</Text>
              <Text className="text-xl font-bold text-zinc-900 dark:text-white">
                {user?.name?.split(' ')[0] ?? 'there'} 👋
              </Text>
            </View>
            {(data?.streak ?? 0) > 0 && (
              <View className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 rounded-2xl px-3 py-1.5 flex-row items-center gap-1">
                <Text>🔥</Text>
                <Text className="text-orange-600 dark:text-orange-400 font-semibold text-sm">{data!.streak}d streak</Text>
              </View>
            )}
          </View>

          {/* Calorie ring card */}
          <View className="bg-white dark:bg-zinc-900 rounded-2xl p-5 mb-4 shadow-sm">
            <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">Today's Calories</Text>
            <View className="flex-row items-center gap-4">
              <View className="relative w-20 h-20 items-center justify-center">
                {/* Simple progress circle using border trick */}
                <View
                  className="w-20 h-20 rounded-full border-4 border-zinc-100 dark:border-zinc-800 absolute"
                />
                <View className="items-center">
                  <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {data?.calories.consumed ?? 0}
                  </Text>
                  <Text className="text-xs text-zinc-400">kcal</Text>
                </View>
              </View>
              <View className="flex-1">
                <View className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                  <View
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${calPct}%` }}
                  />
                </View>
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                  {(data?.calories.goal ?? 2000) - (data?.calories.consumed ?? 0)} kcal remaining
                </Text>
                <Text className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">
                  Goal: {data?.calories.goal ?? 2000} kcal
                </Text>
              </View>
            </View>

            {/* Macros */}
            <View className="flex-row gap-3 mt-4">
              <MacroBar label="Protein" value={data?.macros.protein ?? 0} max={150} color="bg-blue-400" />
              <MacroBar label="Carbs" value={data?.macros.carbs ?? 0} max={250} color="bg-amber-400" />
              <MacroBar label="Fat" value={data?.macros.fat ?? 0} max={65} color="bg-red-400" />
            </View>
          </View>

          {/* Quick actions */}
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              className="flex-1 bg-orange-500 rounded-2xl py-4 items-center active:opacity-80"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                router.push('/(tabs)/food')
              }}
            >
              <Text className="text-xl mb-1">🥗</Text>
              <Text className="text-white font-semibold text-sm">Log Food</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-zinc-900 dark:bg-white rounded-2xl py-4 items-center active:opacity-80"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                router.push('/(tabs)/workout')
              }}
            >
              <Text className="text-xl mb-1">💪</Text>
              <Text className="text-white dark:text-zinc-900 font-semibold text-sm">Log Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl py-4 items-center active:opacity-80"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                router.push('/(tabs)/chat')
              }}
            >
              <Text className="text-xl mb-1">🤖</Text>
              <Text className="text-zinc-700 dark:text-zinc-300 font-semibold text-sm">Ask Coach</Text>
            </TouchableOpacity>
          </View>

          {/* Stats row */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl p-4 items-center shadow-sm">
              <Text className="text-2xl font-bold text-zinc-900 dark:text-white">{data?.completedWorkouts ?? 0}</Text>
              <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Workouts this week</Text>
            </View>
            <View className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl p-4 items-center shadow-sm">
              <Text className="text-2xl font-bold text-zinc-900 dark:text-white">{data?.streak ?? 0}</Text>
              <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Day streak</Text>
            </View>
          </View>

          {/* Recent logs */}
          {(data?.recentLogs?.length ?? 0) > 0 && (
            <View className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
              <Text className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Recent Logs</Text>
              {data!.recentLogs.slice(0, 4).map((log) => (
                <View key={log.id} className="flex-row justify-between items-center py-2 border-b border-zinc-50 dark:border-zinc-800 last:border-0">
                  <View className="flex-1 mr-3">
                    <Text className="text-sm text-zinc-800 dark:text-zinc-200" numberOfLines={1}>{log.food}</Text>
                    <Text className="text-xs text-zinc-400 mt-0.5">{log.time}</Text>
                  </View>
                  <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{log.calories} kcal</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
