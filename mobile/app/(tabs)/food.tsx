import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import * as Haptics from 'expo-haptics'
import { apiFetch } from '@/lib/api'

interface FoodLog {
  id: string
  food: string
  calories: number
  protein: number
  carbs: number
  fat: number
  mealType: string
  loggedAt: string
}

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export default function FoodTab() {
  const qc = useQueryClient()
  const [query, setQuery] = useState('')
  const [mealType, setMealType] = useState('Lunch')

  const today = new Date().toISOString().split('T')[0]

  const { data: foodData, isLoading } = useQuery<{
    logs: FoodLog[]
    totals: { calories: number; protein: number; carbs: number; fat: number }
    dailyTarget: number
  }>({
    queryKey: ['food-logs', today],
    queryFn: () => apiFetch(`/api/food?date=${today}`),
  })

  const logs = foodData?.logs ?? []

  const logMutation = useMutation({
    mutationFn: (text: string) =>
      apiFetch('/api/food', {
        method: 'POST',
        body: JSON.stringify({ description: text, mealType }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['food-logs'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setQuery('')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({ type: 'success', text1: 'Food logged!' })
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to log food', text2: 'Try again.' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/food/logs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['food-logs'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const totalCals = foodData?.totals.calories ?? 0
  const dailyTarget = foodData?.dailyTarget ?? 2000

  const mealGroups = MEAL_TYPES.map((m) => ({
    meal: m,
    logs: logs.filter((l) => l.mealType === m),
  })).filter((g) => g.logs.length > 0)

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="px-5 pt-4 pb-6">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xl font-bold text-zinc-900 dark:text-white">Food Log</Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                {totalCals} / {dailyTarget} kcal
              </Text>
            </View>

            {/* Calorie bar */}
            <View className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-5 mt-2 overflow-hidden">
              <View
                className="h-full bg-orange-500 rounded-full"
                style={{ width: `${Math.min((totalCals / dailyTarget) * 100, 100)}%` }}
              />
            </View>

            {/* Meal type selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <View className="flex-row gap-2">
                {MEAL_TYPES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    className={`px-4 py-2 rounded-full border ${
                      mealType === m
                        ? 'bg-orange-500 border-orange-500'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                    }`}
                    onPress={() => setMealType(m)}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        mealType === m ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Search bar */}
            <View className="flex-row gap-2 mb-6">
              <TextInput
                className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-zinc-900 dark:text-white text-sm"
                placeholder={`What did you eat for ${mealType.toLowerCase()}?`}
                placeholderTextColor="#a1a1aa"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => query.trim() && logMutation.mutate(query)}
                returnKeyType="send"
              />
              <TouchableOpacity
                className={`rounded-2xl px-4 items-center justify-center ${
                  query.trim() ? 'bg-orange-500' : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
                onPress={() => query.trim() && logMutation.mutate(query)}
                disabled={logMutation.isPending || !query.trim()}
              >
                {logMutation.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className={`font-semibold text-sm ${query.trim() ? 'text-white' : 'text-zinc-400'}`}>Log</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Logs */}
            {isLoading ? (
              <ActivityIndicator color="#f97316" className="mt-8" />
            ) : mealGroups.length === 0 ? (
              <View className="items-center mt-12">
                <Text className="text-4xl mb-3">🥗</Text>
                <Text className="text-zinc-500 dark:text-zinc-400 text-base">No food logged yet today</Text>
                <Text className="text-zinc-400 dark:text-zinc-600 text-sm mt-1">
                  e.g. "2 eggs and toast" or "dal rice 1 plate"
                </Text>
              </View>
            ) : (
              mealGroups.map((group) => (
                <View key={group.meal} className="mb-4">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{group.meal}</Text>
                    <Text className="text-xs text-zinc-400">
                      {group.logs.reduce((s, l) => s + l.calories, 0)} kcal
                    </Text>
                  </View>
                  <View className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                    {group.logs.map((log, i) => (
                      <View
                        key={log.id}
                        className={`px-4 py-3 flex-row items-center justify-between ${
                          i < group.logs.length - 1 ? 'border-b border-zinc-50 dark:border-zinc-800' : ''
                        }`}
                      >
                        <View className="flex-1 mr-3">
                          <Text className="text-sm text-zinc-800 dark:text-zinc-200" numberOfLines={1}>
                            {log.food}
                          </Text>
                          <Text className="text-xs text-zinc-400 mt-0.5">
                            P: {log.protein}g · C: {log.carbs}g · F: {log.fat}g
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-3">
                          <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            {log.calories} kcal
                          </Text>
                          <TouchableOpacity
                            onPress={() => deleteMutation.mutate(log.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text className="text-zinc-300 dark:text-zinc-600 text-lg">×</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}

            {/* Macro summary */}
            {foodData && totalCals > 0 && (
              <View className="bg-white dark:bg-zinc-900 rounded-2xl p-4 mt-2 shadow-sm">
                <Text className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Today's Macros</Text>
                <View className="flex-row gap-3">
                  {[
                    { label: 'Protein', value: foodData.totals.protein, unit: 'g', color: 'text-blue-500' },
                    { label: 'Carbs', value: foodData.totals.carbs, unit: 'g', color: 'text-amber-500' },
                    { label: 'Fat', value: foodData.totals.fat, unit: 'g', color: 'text-red-500' },
                  ].map((m) => (
                    <View key={m.label} className="flex-1 items-center">
                      <Text className={`text-lg font-bold ${m.color}`}>
                        {m.value}{m.unit}
                      </Text>
                      <Text className="text-xs text-zinc-500 dark:text-zinc-400">{m.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
