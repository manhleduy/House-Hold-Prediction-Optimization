export const SLOT_COUNT = 144
export const SLOTS_PER_HOUR = 6
export const SLOT_MINUTES = 10

export interface Appliance {
  id: string
  name: string
  power: number
  duration: number
  preferred_start: number
  preferred_end: number
}

export interface PricingConfig {
  peak_hours: [number, number][]
  offpeak_hours: [number, number][]
  normal_price: number
  peak_price: number
  offpeak_price: number
}

export interface PredictRequest {
  date: string
  max_load: number
  pricing: PricingConfig
  appliances: Appliance[]
}

export interface PredictResponse {
  schedule: Record<string, number>
  base_load: number[]
  optimize_load: number[]
}

export interface ScheduleBlock {
  id: string
  name: string
  start: number
  end: number
  power: number
  color: string
}

export interface OptimizationResponse {
  schedule: Record<string, number>
  score: number
  total_cost: number
}

export type ApiSource = 'backend' | 'mock'

export interface ApiResult<T> {
  data: T
  source: ApiSource
}
