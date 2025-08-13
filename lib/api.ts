import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor per aggiungere token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor per gestire errori
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token scaduto o non valido
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// API Functions
export const auth = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: any) =>
    api.post('/auth/register', data),
  
  me: () =>
    api.get('/auth/me'),
}

export const subscription = {
  createCheckout: () =>
    api.post('/subscription/create-checkout'),
  confirm: (session_id?: string) =>
    api.post('/subscription/confirm', { session_id }),
}

export const chatbots = {
  create: (data: any) =>
    api.post('/chatbots/create', data),
  
  list: () =>
    api.get('/chatbots'),
  
  get: (id: number) =>
    api.get(`/chatbots/${id}`),
  
  update: (id: number, data: any) =>
    api.put(`/chatbots/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/chatbots/${id}`),
  
  getConversations: (id: number) =>
    api.get(`/chatbots/${id}/conversations`),
  
  getAnalytics: (id: number) =>
    api.get(`/chatbots/${id}/analytics`),
  
  getKnowledge: (id: number) =>
    api.get(`/chatbots/${id}/knowledge`),
  
  retrain: (id: number) =>
    api.post(`/chatbots/${id}/retrain`),
}

export const conversations = {
  getMessages: (id: number) =>
    api.get(`/conversations/${id}/messages`),
}

export const chat = {
  getInfo: (uuid: string) =>
    api.get(`/chat/${uuid}/info`),
  
  sendMessage: (uuid: string, data: any) =>
    api.post(`/chat/${uuid}/message`, data),
}
