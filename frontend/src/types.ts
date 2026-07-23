export type UserRole = 'user' | 'admin'

export interface User {
  id: number
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  avatar_url?: string | null
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface Product {
  id: number
  barcode: string
  barcode_type: string
  name?: string | null
  brand?: string | null
  category?: string | null
  manufacturer?: string | null
  weight?: string | null
  country_of_origin?: string | null
  image_url?: string | null
  manufacturing_date?: string | null
  expiry_date?: string | null
  ingredients_text?: string | null
  allergens?: string[] | null
  calories?: number | null
  protein_g?: number | null
  fat_g?: number | null
  carbs_g?: number | null
  sugar_g?: number | null
  sodium_mg?: number | null
  is_vegan?: boolean | null
  is_halal?: boolean | null
  ai_summary?: string | null
  ai_pros?: string[] | null
  ai_cons?: string[] | null
  ai_health_score?: number | null
  ai_recommendations?: string | null
  ai_harmful_additives?: Record<string, any>[] | null
  price_estimate?: number | null
  created_at: string
  updated_at: string
}

export interface HarmfulAdditive {
  name: string
  risk_level: string
  reason: string
}

export interface AIAnalysisResponse {
  summary: string
  pros: string[]
  cons: string[]
  health_score: number
  recommendations: string
  similar_products: string[]
  harmful_additives: HarmfulAdditive[]
  allergy_warnings: string[]
}

export interface OCRExtractionResponse {
  expiry_date?: string | null
  manufacturing_date?: string | null
  ingredients_text?: string | null
  nutrition_text?: string | null
  raw_text?: string | null
}

export interface DashboardSummary {
  total_scans: number
  unique_products_scanned: number
  shopping_list_pending: number
  most_scanned_products?: { barcode: string; count: number }[]
}

export interface ScanTrendPoint {
  date: string
  count: number
}

export interface ScanHistoryEntry {
  barcode: string
  scan_method: string
  scanned_at: string
  [key: string]: any
}

export interface ShoppingListItem {
  id: number
  product_id?: number | null
  name: string
  quantity: number
  estimated_price?: number | null
  is_purchased: boolean
  created_at: string
}

export interface ApiError {
  detail?: string | { msg: string }[]
}
