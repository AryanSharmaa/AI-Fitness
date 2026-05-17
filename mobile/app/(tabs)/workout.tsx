import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Toast from 'react-native-toast-message'
import * as Haptics from 'expo-haptics'
import { apiFetch } from '@/lib/api'

interface WorkoutLog {
  id: string
  exercise: string
  sets: number
  reps: number
  weight: number | null
  duration: number | null
  type: string
  loggedAt: string
}

interface PlanExercise {
  name: string
  sets: number
  reps: string
  rest: string
  notes?: string
}

interface WeeklyPlan {
  days: Array<{
    day: string
    focus: string
    exercises: PlanExercise[]
  }>
}

const WORKOUT_TYPES = ['Strength', 'Cardio', 'HIIT', 'Flexibility', 'Sports']

export default function WorkoutTab() {
  const qc = useQueryClient()
  const [showLog, setShowLog] = useState(false)
  const [exercise, setExercise] = useState('')
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('10')
  const [weight, setWeight] = useState('')
  const [duration, setDuration] = useState('')
  const [type, setType] = useState('Strength')

  const today = new Date().toISOString().split('T')[0]
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  const { data: logs = [], isLoading } = useQuery<WorkoutLog[]>({
    queryKey: ['workout-logs', today],
    queryFn: () => apiFetch(`/api/workouts/logs?date=${today}`),
  })

  const { data: plan } = useQuery<WeeklyPlan>({
    queryKey: ['weekly-plan'],
    queryFn: () => apiFetch('/api/weekly-plan'),
    staleTime: 1000 * 60 * 60,
  })

  const todayPlan = plan?.days.find((d) => d.day.toLowerCase() === dayName.toLowerCase())

  const logMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/workouts/logs', {
        method: 'POST',
        body: JSON.stringify({
          exercise: exercise.trim(),
          sets: parseInt(sets),
          reps: parseInt(reps),
          weight: weight ? parseFloat(weight) : null,
          duration: duration ? parseInt(duration) : null,
          type,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workout-logs'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setShowLog(false)
      setExercise('')
      setSets('3')
      setReps('10')
      setWeight('')
      setDuration('')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({ type: 'success', text1: 'Workout logged!' })
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to log workout' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/workouts/logs/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-logs'] }),
  })

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-4 pb-6">
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <Text className="text-xl font-bold text-zinc-900 dark:text-white">Workout</Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">{logs.length} exercises today</Text>
            </View>
            <TouchableOpacity
              className="bg-orange-500 rounded-2xl px-4 py-2.5 active:opacity-80"
              onPress={() => setShowLog(true)}
            >
              <Text className="text-white font-semibold text-sm">+ Log</Text>
            </TouchableOpacity>
          </View>

          {/* Today's AI plan */}
          {todayPlan && (
            <View className="bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-semibold text-zinc-900 dark:text-white">Today's Plan</Text>
                <View className="bg-orange-100 dark:bg-orange-950/40 rounded-full px-2.5 py-0.5">
                  <Text className="text-xs text-orange-600 dark:text-orange-400 font-medium">{todayPlan.focus}</Text>
                </View>
              </View>
              {todayPlan.exercises.map((ex, i) => (
                <View key={i} className={`py-2.5 ${i < todayPlan.exercises.length - 1 ? 'border-b border-zinc-50 dark:border-zinc-800' : ''}`}>
                  <View className="flex-row justify-between items-start">
                    <Text className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex-1 mr-2">{ex.name}</Text>
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                      {ex.sets}×{ex.reps}
                    </Text>
                  </View>
                  {ex.notes && (
                    <Text className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">{ex.notes}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Logged exercises */}
          {isLoading ? (
            <ActivityIndicator color="#f97316" className="mt-8" />
          ) : logs.length === 0 ? (
            <View className="items-center mt-8">
              <Text className="text-4xl mb-3">💪</Text>
              <Text className="text-zinc-500 dark:text-zinc-400 text-base">No exercises logged yet</Text>
              <Text className="text-zinc-400 dark:text-zinc-600 text-sm mt-1">Tap + Log to record your workout</Text>
            </View>
          ) : (
            <View>
              <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Today's Exercises</Text>
              <View className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                {logs.map((log, i) => (
                  <View
                    key={log.id}
                    className={`px-4 py-3 flex-row items-center justify-between ${
                      i < logs.length - 1 ? 'border-b border-zinc-50 dark:border-zinc-800' : ''
                    }`}
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-sm text-zinc-800 dark:text-zinc-200">{log.exercise}</Text>
                      <Text className="text-xs text-zinc-400 mt-0.5">
                        {log.sets}×{log.reps}
                        {log.weight ? ` · ${log.weight}kg` : ''}
                        {log.duration ? ` · ${log.duration}min` : ''}
                        {' · '}{log.type}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => deleteMutation.mutate(log.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text className="text-zinc-300 dark:text-zinc-600 text-lg">×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Log Modal */}
      <Modal visible={showLog} transparent animationType="slide" onRequestClose={() => setShowLog(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white dark:bg-zinc-900 rounded-t-3xl px-5 pt-5 pb-10">
            <View className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full self-center mb-4" />
            <Text className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Log Exercise</Text>

            <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">EXERCISE NAME</Text>
            <TextInput
              className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800 text-sm mb-3"
              placeholder="e.g. Bench Press"
              placeholderTextColor="#a1a1aa"
              value={exercise}
              onChangeText={setExercise}
            />

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">SETS</Text>
                <TextInput
                  className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800 text-sm"
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="number-pad"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">REPS</Text>
                <TextInput
                  className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800 text-sm"
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">WEIGHT (kg)</Text>
                <TextInput
                  className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800 text-sm"
                  placeholder="optional"
                  placeholderTextColor="#a1a1aa"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">DURATION (min)</Text>
                <TextInput
                  className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800 text-sm"
                  placeholder="optional"
                  placeholderTextColor="#a1a1aa"
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {WORKOUT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    className={`px-3 py-2 rounded-full border ${
                      type === t
                        ? 'bg-orange-500 border-orange-500'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                    }`}
                    onPress={() => setType(t)}
                  >
                    <Text className={`text-sm ${type === t ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              className="bg-orange-500 rounded-2xl py-4 items-center active:opacity-80"
              onPress={() => logMutation.mutate()}
              disabled={!exercise.trim() || logMutation.isPending}
            >
              {logMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Save Exercise</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
