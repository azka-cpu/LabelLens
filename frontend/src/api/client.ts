import type {
  AIAnalysisResponse,
  DashboardSummary,
  OCRExtractionResponse,
  Product,
  ScanHistoryEntry,
  ScanTrendPoint,
  ShoppingListItem,
  TokenResponse,
  User,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const ACCESS_KEY = 'smartscan_access_token'
const REFRESH_KEY = 'smartscan_refresh_token'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}
export function setTokens(tokens: TokenResponse | null) {
  if (!tokens) {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    return
  }
  localStorage.setItem(ACCESS_KEY, tokens.access_token)
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
}

export class ApiError extends Error {
  status: number
  detail: string
  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
    this.detail = detail
  }
}

async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail)) return data.detail.map((d: any) => d.msg).join(', ')
    return res.statusText
  } catch {
    return res.statusText || 'Request failed'
  }
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  const refresh_token = getRefreshToken()
  if (!refresh_token) return false
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    })
      .then(async (res) => {
        if (!res.ok) return false
        const data: TokenResponse = await res.json()
        setTokens(data)
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

interface RequestOpts {
  method?: string
  json?: unknown
  form?: FormData
  params?: Record<string, string | number | boolean | undefined>
  auth?: boolean
  raw?: boolean // return the Response itself (e.g. for blob downloads)
}

async function request<T>(path: string, opts: RequestOpts = {}, _retried = false): Promise<T> {
  const { method = 'GET', json, form, params, auth = true } = opts
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
    })
  }

  const headers: Record<string, string> = {}
  if (json !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getAccessToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: form ?? (json !== undefined ? JSON.stringify(json) : undefined),
  })

  if (res.status === 401 && auth && !_retried) {
    const refreshed = await tryRefresh()
    if (refreshed) return request<T>(path, opts, true)
    setTokens(null)
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorDetail(res))
  }

  if (opts.raw) return res as unknown as T
  if (res.status === 204) return undefined as unknown as T
  return res.json()
}

// ---- Auth ----
export const signup = (email: string, full_name: string, password: string) =>
  request<User>('/api/v1/auth/signup', { method: 'POST', json: { email, full_name, password }, auth: false })

export const login = (email: string, password: string) =>
  request<TokenResponse>('/api/v1/auth/login', { method: 'POST', json: { email, password }, auth: false })

// ---- Users ----
export const getProfile = () => request<User>('/api/v1/users/me')
export const updateProfile = (data: { full_name?: string; avatar_url?: string }) =>
  request<User>('/api/v1/users/me', { method: 'PATCH', json: data })
export const changePassword = (old_password: string, new_password: string) =>
  request<{ message: string }>('/api/v1/users/me/change-password', {
    method: 'POST',
    json: { old_password, new_password },
  })
export const getScanHistory = (limit = 50) =>
  request<ScanHistoryEntry[]>('/api/v1/users/me/scan-history', { params: { limit } })

// ---- Dashboard ----
export const getDashboardSummary = () => request<DashboardSummary>('/api/v1/dashboard/summary')
export const getScanTrend = (days = 30) =>
  request<ScanTrendPoint[]>('/api/v1/dashboard/scan-trend', { params: { days } })

// ---- Barcode scanning ----
function fileForm(file: Blob, filename: string) {
  const form = new FormData()
  form.append('file', file, filename)
  return form
}

export const scanUpload = (file: Blob, filename: string) =>
  request<Product[]>('/api/v1/barcode/scan/upload', { method: 'POST', form: fileForm(file, filename) })

export const scanCamera = (file: Blob, filename: string) =>
  request<Product[]>('/api/v1/barcode/scan/camera', { method: 'POST', form: fileForm(file, filename) })

export const manualBarcode = (barcode: string, barcode_type = 'EAN13') =>
  request<Product>('/api/v1/barcode/manual', { method: 'POST', json: { barcode, barcode_type } })

export const batchBarcode = (barcodes: string[]) =>
  request<Product[]>('/api/v1/barcode/batch', {
    method: 'POST',
    json: { barcodes: barcodes.map((barcode) => ({ barcode })) },
  })

// ---- OCR ----
export const ocrExtract = (file: Blob, filename: string) =>
  request<OCRExtractionResponse>('/api/v1/ocr/extract', { method: 'POST', form: fileForm(file, filename) })

// ---- AI analysis ----
export const analyzeProduct = (productId: number) =>
  request<AIAnalysisResponse>(`/api/v1/ai/analyze/${productId}`, { method: 'POST' })

// ---- Products ----
export const getProduct = (productId: number) => request<Product>(`/api/v1/products/${productId}`)

// ---- Shopping list ----
export const listShoppingList = () => request<ShoppingListItem[]>('/api/v1/shopping-list')
export const addShoppingItem = (name: string, quantity = 1, estimated_price?: number) =>
  request<ShoppingListItem>('/api/v1/shopping-list', {
    method: 'POST',
    json: { name, quantity, ...(estimated_price ? { estimated_price } : {}) },
  })
export const toggleShoppingItem = (itemId: number) =>
  request<ShoppingListItem>(`/api/v1/shopping-list/${itemId}/toggle`, { method: 'PATCH' })
export const deleteShoppingItem = (itemId: number) =>
  request<void>(`/api/v1/shopping-list/${itemId}`, { method: 'DELETE' })

export function detectBarcodeType(code: string): string {
  const trimmed = code.trim()
  if (!trimmed) return 'EAN13'
  if (/^\d+$/.test(trimmed)) {
    switch (trimmed.length) {
      case 8:
        return 'EAN8'
      case 6:
        return 'UPCE'
      case 12:
        return 'UPCA'
      case 13:
        return 'EAN13'
      default:
        return 'CODE128'
    }
  }
  if (trimmed.length > 25) return 'QRCODE'
  return 'CODE128'
}
