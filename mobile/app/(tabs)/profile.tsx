import { View, Text, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface ProfileData {
  name: string | null
  email: string
  plan: 'FREE' | 'PRO'
  goals: string | null
  currentWeight: number | null
  targetWeight: number | null
  streak: number
  totalWorkouts: number
  totalFoodLogs: number
}

function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 items-center">
      <Text className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</Text>
      <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 text-center">{label}</Text>
    </View>
  )
}

export default function ProfileTab() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const { data: profile } = useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: () => apiFetch('/api/profile'),
  })

  function handleLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout()
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        },
      },
    ])
  }

  const initials = (user?.name ?? user?.email ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const isPro = user?.plan === 'PRO' || profile?.plan === 'PRO'

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-4 pb-10">
          {/* Avatar + info */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-orange-500 items-center justify-center mb-3">
              <Text className="text-white text-2xl font-bold">{initials}</Text>
            </View>
            <Text className="text-xl font-bold text-zinc-900 dark:text-white">
              {profile?.name ?? user?.name ?? 'User'}
            </Text>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{user?.email}</Text>
            <View
              className={`mt-2 px-3 py-1 rounded-full ${
                isPro ? 'bg-orange-100 dark:bg-orange-950/40' : 'bg-zinc-100 dark:bg-zinc-800'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isPro ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {isPro ? '⭐ Pro' : 'Free Plan'}
              </Text>
            </View>
          </View>

          {/* Stats */}
          {profile && (
            <View className="flex-row gap-3 mb-6">
              <StatCard value={profile.streak} label="Day streak" />
              <StatCard value={profile.totalWorkouts} label="Workouts" />
              <StatCard value={profile.totalFoodLogs} label="Food logs" />
            </View>
          )}

          {/* Weight progress */}
          {profile?.currentWeight && profile?.targetWeight && (
            <View className="bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-4 shadow-sm">
              <Text className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Weight Goal</Text>
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-xs text-zinc-400">Current</Text>
                  <Text className="text-lg font-bold text-zinc-900 dark:text-white">{profile.currentWeight} kg</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl">→</Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs text-zinc-400">Target</Text>
                  <Text className="text-lg font-bold text-orange-500">{profile.targetWeight} kg</Text>
                </View>
              </View>
            </View>
          )}

          {/* Upgrade CTA */}
          {!isPro && (
            <TouchableOpacity className="bg-gradient-to-r from-orange-500 to-orange-600 bg-orange-500 rounded-2xl p-4 mb-4 active:opacity-80">
              <Text className="text-white font-bold text-base">Upgrade to Pro ⭐</Text>
              <Text className="text-orange-100 text-sm mt-0.5">
                Full AI plans, insights & more · ₹499/mo
              </Text>
            </TouchableOpacity>
          )}

          {/* Menu */}
          <View className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm mb-4">
            {[
              { label: 'Recalibrate Goals', emoji: '🎯', onPress: () => {} },
              { label: 'Refer & Earn', emoji: '🎁', onPress: () => {} },
              { label: 'Export Data', emoji: '📊', onPress: () => {} },
            ].map((item, i, arr) => (
              <TouchableOpacity
                key={item.label}
                className={`flex-row items-center px-4 py-4 active:bg-zinc-50 dark:active:bg-zinc-800 ${
                  i < arr.length - 1 ? 'border-b border-zinc-50 dark:border-zinc-800' : ''
                }`}
                onPress={item.onPress}
              >
                <Text className="text-lg mr-3">{item.emoji}</Text>
                <Text className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">{item.label}</Text>
                <Text className="text-zinc-300 dark:text-zinc-600">›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm mb-4">
            {[
              { label: 'Privacy Policy', emoji: '🔒', onPress: () => {} },
              { label: 'Terms of Service', emoji: '📄', onPress: () => {} },
            ].map((item, i, arr) => (
              <TouchableOpacity
                key={item.label}
                className={`flex-row items-center px-4 py-4 active:bg-zinc-50 dark:active:bg-zinc-800 ${
                  i < arr.length - 1 ? 'border-b border-zinc-50 dark:border-zinc-800' : ''
                }`}
                onPress={item.onPress}
              >
                <Text className="text-lg mr-3">{item.emoji}</Text>
                <Text className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">{item.label}</Text>
                <Text className="text-zinc-300 dark:text-zinc-600">›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl py-4 items-center active:opacity-80"
            onPress={handleLogout}
          >
            <Text className="text-red-500 font-semibold text-sm">Log Out</Text>
          </TouchableOpacity>

          <Text className="text-xs text-center text-zinc-300 dark:text-zinc-700 mt-6">
            FitMind AI v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
