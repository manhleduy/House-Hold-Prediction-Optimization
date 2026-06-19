import axios from 'axios'
import { generateMockPrediction, toArrayTimeline } from '../lib/energy'
import type { ApiResult, PredictRequest, PredictResponse } from '../types'

const api = axios.create({
  baseURL: 'http://localhost:8000' ,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const normalizePrediction = (payload: unknown): PredictResponse | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const typed = payload as Partial<PredictResponse>
  const baseLoad = toArrayTimeline(typed.base_load)
  const optimizeLoad = toArrayTimeline(typed.optimize_load)
  const schedule = typed.schedule && typeof typed.schedule === 'object' ? (typed.schedule as Record<string, number>) : null

  if (!baseLoad || !optimizeLoad || !schedule) {
    return null
  }

  return {
    schedule,
    base_load: baseLoad,
    optimize_load: optimizeLoad,
  }
}

export const predictSchedule = async (payload: PredictRequest): Promise<ApiResult<PredictResponse>> => {
  try {
    const response = await api.post('/predict', payload)
    const prediction = normalizePrediction(response.data)

    if (!prediction) {
      throw new Error('Invalid prediction payload')
    }

    return { data: prediction, source: 'backend' }
  } catch {
    return { data: generateMockPrediction(payload), source: 'mock' }
  }
}
