import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const STARTERS = [
  'What should I eat post-workout?',
  'Give me a 20-min home workout',
  'How much protein do I need?',
  'Help me stay motivated',
]

export default function ChatTab() {
  const user = useAuthStore((s) => s.user)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<FlatList>(null)

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages])

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const res = await apiFetch<{ response: string }>('/api/coach/chat', {
        method: 'POST',
        body: JSON.stringify({ message: msg, history }),
      })
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.response,
      }
      setMessages((prev) => [...prev, aiMsg])
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I couldn't connect right now. Please try again.",
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === 'user'
    return (
      <View className={`mb-3 ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && (
          <View className="w-7 h-7 rounded-full bg-orange-500 items-center justify-center mb-1 ml-1">
            <Text className="text-white text-xs font-bold">AI</Text>
          </View>
        )}
        <View
          className={`max-w-[80%] px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-orange-500 rounded-tr-sm'
              : 'bg-white dark:bg-zinc-800 rounded-tl-sm shadow-sm'
          }`}
        >
          <Text
            className={`text-sm leading-relaxed ${
              isUser ? 'text-white' : 'text-zinc-800 dark:text-zinc-200'
            }`}
          >
            {item.content}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950">
          <Text className="text-xl font-bold text-zinc-900 dark:text-white">AI Coach</Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">Powered by FitMind AI</Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(m) => m.id}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 pt-8">
              <View className="items-center mb-8">
                <View className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-950/40 items-center justify-center mb-3">
                  <Text className="text-3xl">🤖</Text>
                </View>
                <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Hey {user?.name?.split(' ')[0] ?? 'there'}!
                </Text>
                <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 text-center px-4">
                  I'm your AI fitness coach. Ask me anything about workouts, nutrition, or motivation.
                </Text>
              </View>
              <Text className="text-xs font-semibold text-zinc-400 dark:text-zinc-600 mb-3 px-1">
                QUICK STARTERS
              </Text>
              {STARTERS.map((s) => (
                <TouchableOpacity
                  key={s}
                  className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 py-3 mb-2 active:opacity-70"
                  onPress={() => sendMessage(s)}
                >
                  <Text className="text-sm text-zinc-700 dark:text-zinc-300">{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          }
        />

        {/* Loading indicator */}
        {loading && (
          <View className="px-5 pb-2 items-start">
            <View className="bg-white dark:bg-zinc-800 rounded-2xl px-4 py-3 flex-row gap-1.5 shadow-sm">
              {[0, 1, 2].map((i) => (
                <View key={i} className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              ))}
            </View>
          </View>
        )}

        {/* Input */}
        <View className="px-4 pb-4 pt-2 flex-row gap-2 bg-zinc-50 dark:bg-zinc-950">
          <TextInput
            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-zinc-900 dark:text-white text-sm"
            placeholder="Ask your coach..."
            placeholderTextColor="#a1a1aa"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
            blurOnSubmit
          />
          <TouchableOpacity
            className={`w-12 rounded-2xl items-center justify-center ${
              input.trim() ? 'bg-orange-500' : 'bg-zinc-200 dark:bg-zinc-800'
            }`}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Text className="text-xl">↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
