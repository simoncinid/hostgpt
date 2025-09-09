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
  create: async (data: any, iconFile?: File) => {
    const formData = new FormData()
    
    console.log('🚀 API: Dati ricevuti per creazione chatbot:', data)
    
    // Aggiungi tutti i campi come stringhe, gestendo i valori null/undefined
    Object.keys(data).forEach(key => {
      const value = data[key]
      if (value === null || value === undefined) {
        // Salta i valori null/undefined
        return
      }
      
      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        const jsonValue = JSON.stringify(value)
        formData.append(key, jsonValue)
        console.log(`🚀 API: Aggiunto ${key} (JSON):`, jsonValue)
      } else {
        const stringValue = String(value)
        formData.append(key, stringValue)
        console.log(`🚀 API: Aggiunto ${key} (string):`, stringValue)
      }
    })
    
    // Aggiungi il file icona se presente
    if (iconFile) {
      formData.append('icon', iconFile)
      console.log('🚀 API: Aggiunto file icona:', iconFile.name)
    }
    
    // Debug: mostra tutti i campi del FormData
    console.log('🚀 API: FormData entries:')
    Array.from(formData.entries()).forEach(([key, value]) => {
      console.log(`  ${key}:`, value)
    })
    
    // Usa fetch direttamente per evitare problemi con Axios e FormData
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    
    const response = await fetch(`${API_URL}/api/chatbots/create`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        // Non impostare Content-Type, lascia che il browser lo imposti automaticamente per FormData
      },
      body: formData
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw {
        response: {
          status: response.status,
          data: errorData
        }
      }
    }
    
    return {
      data: await response.json()
    }
  },
  
  list: () =>
    api.get('/chatbots'),
  
  get: (id: number) =>
    api.get(`/chatbots/${id}`),
  
  update: (id: number, data: any) =>
    api.put(`/chatbots/${id}`, data),
  
  updateIcon: (id: number, iconFile: FormData) =>
    api.put(`/chatbots/${id}/icon`, iconFile, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
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
