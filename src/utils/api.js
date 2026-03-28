import axios from "axios"

const getApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim()

  if (!configuredUrl) {
    return "http://localhost:5000/api"
  }

  const withoutTrailingSlash = configuredUrl.replace(/\/+$/, "")
  return /\/api$/.test(withoutTrailingSlash)
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api