import {
  SLOT_COUNT,
  SLOT_MINUTES,
  SLOTS_PER_HOUR,
  type Appliance,
  type PredictRequest,
  type PredictResponse,
  type ScheduleBlock,
} from '../types'

const tariffBands = [
  { start: 0, end: 36, rate: 0.82 },
  { start: 36, end: 72, rate: 1.0 },
  { start: 72, end: 102, rate: 1.18 },
  { start: 102, end: 126, rate: 1.42 },
  { start: 126, end: 144, rate: 1.08 },
]

export const clampSlot = (value: number) => Math.min(SLOT_COUNT - 1, Math.max(0, Math.round(value)))

export const slotToTime = (slot: number) => {
  const normalized = clampSlot(slot)
  const totalMinutes = normalized * SLOT_MINUTES
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

export const slotToHourLabel = (slot: number) => `${Math.floor(slot / SLOTS_PER_HOUR).toString().padStart(2, '0')}:00`

export const normalizeWindow = (start: number, end: number) => {
  const safeStart = clampSlot(start)
  const safeEnd = clampSlot(end)

  return safeStart <= safeEnd ? { start: safeStart, end: safeEnd } : { start: safeEnd, end: safeStart }
}

export const createDefaultAppliance = (index = 1): Appliance => ({
  id: crypto.randomUUID(),
  name: `Appliance ${index}`,
  power: 1200,
  duration: 6,
  preferred_start: 48,
  preferred_end: 108,
})

export const buildInitialAppliances = () => [createDefaultAppliance()]

export const buildSeedRequest = (): PredictRequest => ({
  date: '2026-06-14',
  max_load: 3000,
  pricing: {
    peak_hours: [[18, 22]],
    offpeak_hours: [[0, 6]],
    normal_price: 0.2,
    peak_price: 0.4,
    offpeak_price: 0.1,
  },
  appliances: [
    {
      id: '1',
      name: 'Washing Machine',
      power: 200,
      duration: 12,
      preferred_start: 36,
      preferred_end: 120,
    },
    {
      id: '2',
      name: 'Dishwasher',
      power: 150,
      duration: 10,
      preferred_start: 60,
      preferred_end: 132,
    },
    {
      id: '3',
      name: 'EV Charger',
      power: 70,
      duration: 24,
      preferred_start: 72,
      preferred_end: 143,
    },
  ],
})

export const getTariffRate = (slot: number) => {
  const safeSlot = clampSlot(slot)
  return tariffBands.find((band) => safeSlot >= band.start && safeSlot < band.end)?.rate ?? 1
}

export const calculateWeightedCost = (load: number[]) =>
  load.reduce((total, value, slot) => total + (value * SLOT_MINUTES * getTariffRate(slot)) / (60 * 1000), 0)

export const calculatePeakLoad = (load: number[]) => load.reduce((peak, value) => Math.max(peak, value), 0)

export const buildOptimizedLoad = (baseLoad: number[], appliances: Appliance[], schedule: Record<string, number>) => {
  const nextLoad = [...baseLoad]

  for (const appliance of appliances) {
    const start = schedule[appliance.id]

    if (typeof start !== 'number') {
      continue
    }

    const safeStart = clampSlot(start)
    const safeDuration = Math.max(1, Math.min(SLOT_COUNT, Math.round(appliance.duration)))

    for (let offset = 0; offset < safeDuration; offset += 1) {
      const slot = safeStart + offset

      if (slot >= SLOT_COUNT) {
        break
      }

      nextLoad[slot] = (nextLoad[slot] ?? 0) + appliance.power
    }
  }

  return nextLoad
}

export const buildScheduleBlocks = (appliances: Appliance[], schedule: Record<string, number>) =>
  appliances.flatMap((appliance, index) => {
    const start = schedule[appliance.id]

    if (typeof start !== 'number') {
      return []
    }

    const safeStart = clampSlot(start)
    const safeDuration = Math.max(1, Math.min(SLOT_COUNT, Math.round(appliance.duration)))
    const end = Math.min(SLOT_COUNT, safeStart + safeDuration)

    return [
      {
        id: appliance.id,
        name: appliance.name || `Appliance ${index + 1}`,
        start: safeStart,
        end,
        power: appliance.power,
        color: colorFromId(appliance.id),
      } satisfies ScheduleBlock,
    ]
  })

export const colorFromId = (id: string) => {
  const palette = ['#22c55e', '#06b6d4', '#f59e0b', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6']
  let hash = 0

  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0
  }

  return palette[hash % palette.length]
}

export const createDemoTimeline = () =>
  Array.from({ length: SLOT_COUNT }, (_, slot) => {
    const hour = slot / SLOTS_PER_HOUR
    const morningPeak = Math.exp(-((hour - 7.5) ** 2) / 10)
    const eveningPeak = Math.exp(-((hour - 19.5) ** 2) / 14)
    const middayBump = Math.exp(-((hour - 13) ** 2) / 20)
    const ripple = Math.sin(slot / 4.5) * 8 + Math.cos(slot / 9) * 5

    return Math.round(120 + morningPeak * 70 + middayBump * 35 + eveningPeak * 95 + ripple)
  })

export const toArrayTimeline = (input: unknown) => {
  if (!Array.isArray(input)) {
    return null
  }

  const values = input
    .slice(0, SLOT_COUNT)
    .map((value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0))

  if (values.length !== SLOT_COUNT) {
    return null
  }

  return values
}

export const findBestStart = (baseLoad: number[], appliance: Appliance) => {
  const duration = Math.max(1, Math.min(SLOT_COUNT, Math.round(appliance.duration)))
  const window = normalizeWindow(appliance.preferred_start, appliance.preferred_end)
  const latestStart = Math.max(0, Math.min(window.end, SLOT_COUNT - duration))
  const earliestStart = Math.max(0, Math.min(window.start, latestStart))
  let bestStart = earliestStart
  let bestScore = Number.POSITIVE_INFINITY
  const preferredCenter = (window.start + window.end) / 2

  for (let start = earliestStart; start <= latestStart; start += 1) {
    let weightedCost = 0
    let peak = 0

    for (let offset = 0; offset < duration; offset += 1) {
      const slot = start + offset
      const projected = (baseLoad[slot] ?? 0) + appliance.power
      weightedCost += projected * getTariffRate(slot)
      peak = Math.max(peak, projected)
    }

    const distancePenalty = Math.abs(start + duration / 2 - preferredCenter) * 4
    const peakPenalty = peak * 0.08
    const score = weightedCost + distancePenalty + peakPenalty

    if (score < bestScore) {
      bestScore = score
      bestStart = start
    }
  }

  return bestStart
}

export const generateMockOptimization = (baseLoad: number[], appliances: Appliance[]) => {
  const sortedAppliances = [...appliances].sort((left, right) => right.power * right.duration - left.power * left.duration)
  const schedule: Record<string, number> = {}
  const workingLoad = [...baseLoad]

  for (const appliance of sortedAppliances) {
    const start = findBestStart(workingLoad, appliance)
    schedule[appliance.id] = start

    for (let offset = 0; offset < Math.max(1, appliance.duration); offset += 1) {
      const slot = start + offset

      if (slot >= SLOT_COUNT) {
        break
      }

      workingLoad[slot] = (workingLoad[slot] ?? 0) + appliance.power
    }
  }

  const totalCost = Math.round(calculateWeightedCost(workingLoad) * 100) / 100
  const baseCost = calculateWeightedCost(baseLoad)
  const score = Math.max(0, Math.round(((baseCost - totalCost) / Math.max(baseCost, 1)) * 1000))

  return {
    schedule,
    score,
    total_cost: totalCost,
  }
}

export const generateMockPrediction = (request: PredictRequest): PredictResponse => {
  const baseLoad = createDemoTimeline()
  const optimization = generateMockOptimization(baseLoad, request.appliances)
  const optimizeLoad = buildOptimizedLoad(baseLoad, request.appliances, optimization.schedule)

  return {
    schedule: optimization.schedule,
    base_load: baseLoad,
    optimize_load: optimizeLoad,
  }
}

export const estimateEnergySavingsPct = (baselineCost: number, optimizedCost: number) => {
  if (!Number.isFinite(baselineCost) || baselineCost <= 0) {
    return 0
  }

  return Math.max(0, ((baselineCost - optimizedCost) / baselineCost) * 100)
}
