import axios from "axios"

export const getApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim()

  if (!configuredUrl) {
    return "http://localhost:5000/api"
  }

  const withoutTrailingSlash = configuredUrl.replace(/\/+$/, "")
  return /\/api$/.test(withoutTrailingSlash)
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`
}

export const normalizeMemoriesResponse = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.memories)) return data.memories
  return []
}

export const normalizeListResponse = (data, key) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.[key])) return data[key]
  return []
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