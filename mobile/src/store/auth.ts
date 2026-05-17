import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

interface User {
  id: string
  name: string | null
  email: string
  plan: 'FREE' | 'PRO'
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  setUser: (user: User, token: string) => Promise<void>
  logout: () => Promise<void>
  loadFromStorage: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setUser: async (user, token) => {
    await SecureStore.setItemAsync('session_token', token)
    await SecureStore.setItemAsync('session_user', JSON.stringify(user))
    set({ user, token, isLoading: false })
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('session_token')
    await SecureStore.deleteItemAsync('session_user')
    set({ user: null, token: null, isLoading: false })
  },

  loadFromStorage: async () => {
    const token = await SecureStore.getItemAsync('session_token')
    const userStr = await SecureStore.getItemAsync('session_user')
    if (token && userStr) {
      set({ user: JSON.parse(userStr), token, isLoading: false })
    } else {
      set({ isLoading: false })
    }
  },
}))
