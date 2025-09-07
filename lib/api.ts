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
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
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
  createCombinedCheckout: () =>
    api.post('/subscription/create-combined-checkout'),
  confirm: (session_id?: string) =>
    api.post('/subscription/confirm', { session_id }),
  confirmPayment: (payment_intent_id: string, data?: any) =>
    api.post('/subscription/confirm-payment', { payment_intent_id, ...data }),
  confirmCombinedPayment: (payment_intent_id: string, data?: any) =>
    api.post('/subscription/confirm-combined-payment', { payment_intent_id, ...data }),
  cancel: () =>
    api.post('/subscription/cancel'),
}



export const freeTrial = {
  start: () =>
    api.post('/free-trial/start'),
  getStatus: () =>
    api.get('/free-trial/status'),
}

export const referral = {
  validate: (code: string) =>
    api.post('/referral/validate', { code }),
  getStats: () =>
    api.get('/referral/stats'),
}

export const chatbots = {
  create: (data: any, iconFile?: File) => {
    const formData = new FormData()
    
    // Aggiungi tutti i campi come stringhe
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key]) || typeof data[key] === 'object') {
        formData.append(key, JSON.stringify(data[key]))
      } else {
        formData.append(key, data[key])
      }
    })
    
    // Aggiungi il file icona se presente
    if (iconFile) {
      formData.append('icon', iconFile)
    }
    
    return api.post('/chatbots/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  
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
  
  getIcon: (id: number) =>
    api.get(`/chatbots/${id}/icon`, { responseType: 'blob' }),
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
  
  getDemoInfo: () =>
    api.get('/demo/info'),
  
  getDemoIcon: () =>
    api.get('/demo/icon', { responseType: 'blob' }),
}

export const guardian = {
  getStatus: () =>
    api.get('/guardian/status'),
  
  createCheckout: () =>
    api.post('/guardian/create-checkout'),
  
  confirmPayment: (payment_intent_id: string, data?: any) =>
    api.post('/guardian/confirm-payment', { payment_intent_id, ...data }),
  
  cancel: () =>
    api.post('/guardian/cancel'),
  
  reactivate: () =>
    api.post('/guardian/reactivate'),
  
  getStatistics: () =>
    api.get('/guardian/statistics'),
  
  getAlerts: () =>
    api.get('/guardian/alerts'),
  
  resolveAlert: (alertId: number) =>
    api.post(`/guardian/alerts/${alertId}/resolve`),
}
