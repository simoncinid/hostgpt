import { create } from 'zustand'

interface User {
  id: number
  email: string
  full_name: string
  subscription_status: string
  subscription_end_date: string | null
  guardian_subscription_status: string
  guardian_subscription_end_date: string | null
  // Free trial fields
  wants_free_trial: boolean
  messages_limit: number
  messages_used: number
  messages_remaining: number
  free_trial_start_date: string | null
  free_trial_end_date: string | null
  free_trial_messages_limit: number
  free_trial_messages_used: number
  free_trial_converted: boolean
  is_free_trial_active: boolean
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  setAuth: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  
  setAuth: (token: string) => set({ 
    token, 
    isAuthenticated: true 
  }),
  
  setUser: (user: User) => set({ user }),
  
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    set({ 
      token: null, 
      user: null, 
      isAuthenticated: false 
    })
  },
}))

interface Chatbot {
  id: number
  uuid: string
  name: string
  property_name: string
  property_city: string
  chat_url: string
  qr_code: string
  total_conversations: number
  total_messages: number
  is_active: boolean
  created_at: string
  has_icon: boolean
}

interface ChatbotLimits {
  current_count: number
  max_allowed: number
  can_create_new: boolean
}

interface ChatbotState {
  chatbots: Chatbot[]
  limits: ChatbotLimits | null
  currentChatbot: Chatbot | null
  setChatbots: (chatbots: Chatbot[]) => void
  setLimits: (limits: ChatbotLimits | null) => void
  setCurrentChatbot: (chatbot: Chatbot | null) => void
  addChatbot: (chatbot: Chatbot) => void
  updateChatbot: (id: number, updates: Partial<Chatbot>) => void
  deleteChatbot: (id: number) => void
}

export const useChatbotStore = create<ChatbotState>((set) => ({
  chatbots: [],
  limits: null,
  currentChatbot: null,
  
  setChatbots: (chatbots) => set({ chatbots }),
  
  setLimits: (limits) => set({ limits }),
  
  setCurrentChatbot: (chatbot) => set({ currentChatbot: chatbot }),
  
  addChatbot: (chatbot) => set((state) => ({ 
    chatbots: [...state.chatbots, chatbot],
    limits: state.limits ? {
      ...state.limits,
      current_count: state.limits.current_count + 1,
      can_create_new: (state.limits.current_count + 1) < state.limits.max_allowed
    } : null
  })),
  
  updateChatbot: (id, updates) => set((state) => ({
    chatbots: state.chatbots.map(bot => 
      bot.id === id ? { ...bot, ...updates } : bot
    ),
    currentChatbot: state.currentChatbot?.id === id 
      ? { ...state.currentChatbot, ...updates }
      : state.currentChatbot
  })),
  
  deleteChatbot: (id) => set((state) => ({
    chatbots: state.chatbots.filter(bot => bot.id !== id),
    currentChatbot: state.currentChatbot?.id === id 
      ? null 
      : state.currentChatbot,
    limits: state.limits ? {
      ...state.limits,
      current_count: Math.max(0, state.limits.current_count - 1),
      can_create_new: (state.limits.current_count - 1) < state.limits.max_allowed
    } : null
  })),
}))
