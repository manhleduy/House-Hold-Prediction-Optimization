import { startTransition, useMemo, useState } from 'react'
import { ApplianceForm } from '../components/ApplianceForm'
import { PredictionConfigForm } from '../components/PredictionConfigForm'
import { SummaryPanel } from '../components/SummaryPanel'
import { TimelineChart } from '../components/TimelineChart'
import {
  buildOptimizedLoad,
  buildScheduleBlocks,
  buildSeedRequest,
  calculatePeakLoad,
  calculateWeightedCost,
} from '../lib/energy'
import { predictSchedule } from '../services/api'
import type { Appliance, PredictRequest } from '../types'

const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'

type RequestState = 'idle' | 'pending' | 'success' | 'error'

export function Dashboard() {
  const [request, setRequest] = useState<PredictRequest>(() => buildSeedRequest())
  const [timeline, setTimeline] = useState<number[] | null>(null)
  const [optimizedTimeline, setOptimizedTimeline] = useState<number[] | null>(null)
  const [schedule, setSchedule] = useState<Record<string, number> | null>(null)
  const [requestState, setRequestState] = useState<RequestState>('idle')
  const [statusMessage, setStatusMessage] = useState<string>('Ready to send the prediction request.')
  const [isPending, setIsPending] = useState(false)

  const optimizeDisabled = isPending || !request.appliances.length

  const derivedOptimizedTimeline = useMemo(() => {
    if (!timeline || !schedule) {
      return null
    }

    return buildOptimizedLoad(timeline, request.appliances, schedule)
  }, [request.appliances, schedule, timeline])

  const displayOptimizedTimeline = optimizedTimeline ?? derivedOptimizedTimeline
  const blocks = useMemo(() => (schedule ? buildScheduleBlocks(request.appliances, schedule) : []), [request.appliances, schedule])

  const baselineCost = useMemo(() => (timeline ? Math.round(calculateWeightedCost(timeline) * 100) / 100 : null), [timeline])
  const optimizedCost = useMemo(
    () => (displayOptimizedTimeline ? Math.round(calculateWeightedCost(displayOptimizedTimeline) * 100) / 100 : null),
    [displayOptimizedTimeline],
  )
  const score = useMemo(() => {
    if (baselineCost == null || optimizedCost == null || baselineCost <= 0) {
      return null
    }

    return Math.max(0, Math.round(((baselineCost - optimizedCost) / baselineCost) * 1000))
  }, [baselineCost, optimizedCost])
  const savingsPct = useMemo(() => {
    if (baselineCost == null || optimizedCost == null || baselineCost <= 0) {
      return null
    }

    return Math.max(0, ((baselineCost - optimizedCost) / baselineCost) * 100)
  }, [baselineCost, optimizedCost])
  const peakLoad = useMemo(() => (displayOptimizedTimeline ? calculatePeakLoad(displayOptimizedTimeline) : null), [displayOptimizedTimeline])

  const handleSubmit = async () => {
    if (!request.date) {
      setRequestState('error')
      setStatusMessage('Please choose a date before sending the request.')
      return
    }

    setIsPending(true)
    setRequestState('pending')
    setStatusMessage('Sending POST /predict...')

    try {
      const response = await predictSchedule(request)

      startTransition(() => {
        setTimeline(response.data.base_load)
        setOptimizedTimeline(response.data.optimize_load)
        setSchedule(response.data.schedule)
        setRequestState('success')
        setStatusMessage(response.source === 'backend' ? 'Backend response received successfully.' : 'Backend unavailable, using mock fallback data.')
      })
    } catch (error) {
      setRequestState('error')
      setStatusMessage(error instanceof Error ? error.message : 'Request failed.')
    } finally {
      setIsPending(false)
    }
  }

  const handleApplianceChange = <K extends keyof Omit<Appliance, 'id'>>(id: string, field: K, value: Appliance[K]) => {
    setRequest((current) => ({
      ...current,
      appliances: current.appliances.map((item) => {
        if (item.id !== id) {
          return item
        }

        if (field === 'name') {
          return {
            ...item,
            name: String(value),
          }
        }

        if (field === 'duration') {
          return {
            ...item,
            duration: Math.max(1, Number(value)),
          }
        }

        return {
          ...item,
          [field]: Math.max(0, Number(value)),
        } as Appliance
      }),
    }))
  }

  return (
    <main className="min-h-screen px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(2,6,23,0.92),rgba(15,23,42,0.72))] px-6 py-6 shadow-[0_24px_80px_rgba(2,6,23,0.4)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                Smart Energy Scheduling
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
                Send the `/predict` payload, get the base load, and inspect the optimized schedule.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                This screen mirrors the backend seed body: date, max load, pricing, and appliances. One request returns the base load and the optimizer output together.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-slate-400">State</div>
                <div className="mt-1 font-semibold text-slate-50 capitalize">{requestState}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-slate-400">Peak Load</div>
                <div className="mt-1 font-semibold text-slate-50">{peakLoad == null ? '—' : `${Math.round(peakLoad)} W`}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-slate-400">Baseline Cost</div>
                <div className="mt-1 font-semibold text-slate-50">{baselineCost == null ? '—' : `$${baselineCost.toFixed(2)}`}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-slate-400">Savings</div>
                <div className="mt-1 font-semibold text-slate-50">{savingsPct == null ? '—' : `${savingsPct.toFixed(1)}%`}</div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-50">Request Controls</h2>
                  <p className="text-sm text-slate-400">The inputs below are posted directly to the backend.</p>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={optimizeDisabled}
                  className={`${buttonClass} bg-cyan-400 text-slate-950 hover:bg-cyan-300`}
                >
                  {isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                      Sending...
                    </>
                  ) : (
                    'Generate Base Load'
                  )}
                </button>
              </div>

              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  requestState === 'error'
                    ? 'border-rose-400/20 bg-rose-400/10 text-rose-100'
                    : requestState === 'success'
                      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-slate-300'
                }`}
              >
                {statusMessage}
              </div>

              <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-slate-500">Date</div>
                  <div className="mt-1 font-medium text-slate-100">{request.date}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-slate-500">Max Load</div>
                  <div className="mt-1 font-medium text-slate-100">{request.max_load} W</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-slate-500">Appliances</div>
                  <div className="mt-1 font-medium text-slate-100">{request.appliances.length} configured</div>
                </div>
              </div>
            </section>

            <PredictionConfigForm
              request={request}
              onDateChange={(date) => setRequest((current) => ({ ...current, date }))}
              onMaxLoadChange={(value) => setRequest((current) => ({ ...current, max_load: Math.max(1, value) }))}
              onPricingChange={(field, value) =>
                setRequest((current) => ({
                  ...current,
                  pricing: {
                    ...current.pricing,
                    [field]: value,
                  },
                }))
              }
              disabled={isPending}
            />

            <ApplianceForm
              appliances={request.appliances}
              onAdd={() =>
                setRequest((current) => ({
                  ...current,
                  appliances: [
                    ...current.appliances,
                    {
                      id: crypto.randomUUID(),
                      name: `Appliance ${current.appliances.length + 1}`,
                      power: 1000,
                      duration: 6,
                      preferred_start: 48,
                      preferred_end: 108,
                    },
                  ],
                }))
              }
              onRemove={(id) =>
                setRequest((current) => ({
                  ...current,
                  appliances: current.appliances.length === 1 ? current.appliances : current.appliances.filter((item) => item.id !== id),
                }))
              }
              onChange={handleApplianceChange}
              disabled={isPending}
            />
          </div>

          <div className="space-y-6">
            <TimelineChart
              timeline={timeline}
              optimizedTimeline={displayOptimizedTimeline}
              appliances={request.appliances}
              schedule={schedule}
              loading={requestState === 'pending'}
            />
            <SummaryPanel
              timeline={timeline}
              optimizedTimeline={displayOptimizedTimeline}
              appliances={request.appliances}
              blocks={blocks}
              score={score}
              totalCost={optimizedCost}
              sourceLabel={requestState === 'success' ? 'Response received' : requestState === 'pending' ? 'Waiting for backend' : 'Idle'}
            />
          </div>
        </section>
      </div>
    </main>
  )
}
