import { create } from 'zustand'

interface User {
  id: number
  email: string
  full_name: string
  subscription_status: string
  subscription_end_date: string | null
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
    localStorage.removeItem('token')
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
}

interface ChatbotState {
  chatbots: Chatbot[]
  currentChatbot: Chatbot | null
  setChatbots: (chatbots: Chatbot[]) => void
  setCurrentChatbot: (chatbot: Chatbot | null) => void
  addChatbot: (chatbot: Chatbot) => void
  updateChatbot: (id: number, updates: Partial<Chatbot>) => void
  deleteChatbot: (id: number) => void
}

export const useChatbotStore = create<ChatbotState>((set) => ({
  chatbots: [],
  currentChatbot: null,
  
  setChatbots: (chatbots) => set({ chatbots }),
  
  setCurrentChatbot: (chatbot) => set({ currentChatbot: chatbot }),
  
  addChatbot: (chatbot) => set((state) => ({ 
    chatbots: [...state.chatbots, chatbot] 
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
      : state.currentChatbot
  })),
}))
