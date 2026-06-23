import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// TODO: Add auth token injection once login stores the JWT returned by /api/v1/auth/login.
// TODO: Keep all future Flask API calls in this module or small service modules that import this client.

export default api
