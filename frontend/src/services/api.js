import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para logs de request
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Interceptor para logs de response
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const participantService = {
  register: async (formData) => {
    const response = await api.post('/participants/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/participants/${id}`)
    return response.data
  }
}

export const checkinService = {
  faceCheckin: async (imageFile) => {
    const formData = new FormData()
    formData.append('photo', imageFile)
    
    const response = await api.post('/checkin/face', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  manualCheckin: async (email) => {
    const response = await api.post('/checkin/manual', { email })
    return response.data
  },

  getAssistance: async (query, participantId) => {
    const response = await api.post('/checkin/assistance', { query, participantId })
    return response.data
  }
}

export const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats')
    return response.data
  },

  getParticipants: async () => {
    const response = await api.get('/admin/participants')
    return response.data
  },

  getCheckins: async (limit = 50) => {
    const response = await api.get(`/admin/checkins?limit=${limit}`)
    return response.data
  },

  getParticipantDetails: async (id) => {
    const response = await api.get(`/admin/participants/${id}`)
    return response.data
  }
}

export default api
