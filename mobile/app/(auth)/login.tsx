import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import Toast from 'react-native-toast-message'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export default function LoginScreen() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendOtp() {
    if (!email.trim()) return
    setLoading(true)
    try {
      await apiFetch('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      setStep('otp')
      Toast.show({ type: 'success', text1: 'OTP sent!', text2: 'Check your email.' })
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to send OTP', text2: 'Try again.' })
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp() {
    if (!otp.trim()) return
    setLoading(true)
    try {
      const data = await apiFetch<{ token: string; user: { id: string; name: string | null; email: string; plan: 'FREE' | 'PRO' } }>(
        '/api/auth/verify-otp',
        {
          method: 'POST',
          body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
        },
      )
      await setUser(data.user, data.token)
    } catch {
      Toast.show({ type: 'error', text1: 'Invalid OTP', text2: 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-zinc-950"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-20 pb-10 justify-between">
          <View>
            <View className="mb-10">
              <View className="w-14 h-14 rounded-2xl bg-orange-500 items-center justify-center mb-4">
                <Text className="text-white text-2xl font-bold">F</Text>
              </View>
              <Text className="text-3xl font-bold text-zinc-900 dark:text-white">FitMind AI</Text>
              <Text className="text-zinc-500 dark:text-zinc-400 mt-1">Your AI fitness coach</Text>
            </View>

            {step === 'email' ? (
              <View>
                <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Email address</Text>
                <TextInput
                  className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-900 text-base"
                  placeholder="you@example.com"
                  placeholderTextColor="#a1a1aa"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onSubmitEditing={sendOtp}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  className="bg-orange-500 rounded-xl py-4 mt-4 items-center active:opacity-80"
                  onPress={sendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-semibold text-base">Continue with Email</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  We sent a 6-digit code to{' '}
                  <Text className="font-semibold text-zinc-900 dark:text-white">{email}</Text>
                </Text>
                <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Verification code</Text>
                <TextInput
                  className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-900 text-base tracking-widest text-center"
                  placeholder="000000"
                  placeholderTextColor="#a1a1aa"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  onSubmitEditing={verifyOtp}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  className="bg-orange-500 rounded-xl py-4 mt-4 items-center active:opacity-80"
                  onPress={verifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-semibold text-base">Verify & Sign In</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity className="mt-3 items-center" onPress={() => setStep('email')}>
                  <Text className="text-sm text-zinc-500 dark:text-zinc-400">Change email</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text className="text-xs text-center text-zinc-400 dark:text-zinc-600 px-4">
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
