import type { PredictRequest, PricingConfig } from '../types'

interface PredictionConfigFormProps {
  request: PredictRequest
  onDateChange: (date: string) => void
  onMaxLoadChange: (value: number) => void
  onPricingChange: <K extends keyof PricingConfig>(field: K, value: PricingConfig[K]) => void
  disabled?: boolean
}

const inputClass =
  'w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/80 focus:ring-2 focus:ring-cyan-400/20'

export function PredictionConfigForm({ request, onDateChange, onMaxLoadChange, onPricingChange, disabled }: PredictionConfigFormProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-50">Prediction Input</h2>
        <p className="text-sm text-slate-400">This mirrors the body sent to `POST /predict`.</p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Date</span>
            <input
              type="date"
              className={inputClass}
              value={request.date}
              onChange={(event) => onDateChange(event.target.value)}
              disabled={disabled}
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Max Load (W)</span>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={request.max_load}
              onChange={(event) => onMaxLoadChange(Number(event.target.value))}
              disabled={disabled}
            />
          </label>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-100">Pricing</h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label>
              <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Peak Start</span>
              <input
                type="number"
                min={0}
                max={23}
                className={inputClass}
                value={request.pricing.peak_hours[0]?.[0] ?? 18}
                onChange={(event) => onPricingChange('peak_hours', [[Number(event.target.value), request.pricing.peak_hours[0]?.[1] ?? 22]])}
                disabled={disabled}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Peak End</span>
              <input
                type="number"
                min={1}
                max={24}
                className={inputClass}
                value={request.pricing.peak_hours[0]?.[1] ?? 22}
                onChange={(event) => onPricingChange('peak_hours', [[request.pricing.peak_hours[0]?.[0] ?? 18, Number(event.target.value)]])}
                disabled={disabled}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Off-peak Start</span>
              <input
                type="number"
                min={0}
                max={23}
                className={inputClass}
                value={request.pricing.offpeak_hours[0]?.[0] ?? 0}
                onChange={(event) =>
                  onPricingChange('offpeak_hours', [[Number(event.target.value), request.pricing.offpeak_hours[0]?.[1] ?? 6]])
                }
                disabled={disabled}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Off-peak End</span>
              <input
                type="number"
                min={1}
                max={24}
                className={inputClass}
                value={request.pricing.offpeak_hours[0]?.[1] ?? 6}
                onChange={(event) =>
                  onPricingChange('offpeak_hours', [[request.pricing.offpeak_hours[0]?.[0] ?? 0, Number(event.target.value)]])
                }
                disabled={disabled}
              />
            </label>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <label>
              <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Normal Price</span>
              <input
                type="number"
                step="0.01"
                min={0}
                className={inputClass}
                value={request.pricing.normal_price}
                onChange={(event) => onPricingChange('normal_price', Number(event.target.value))}
                disabled={disabled}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Peak Price</span>
              <input
                type="number"
                step="0.01"
                min={0}
                className={inputClass}
                value={request.pricing.peak_price}
                onChange={(event) => onPricingChange('peak_price', Number(event.target.value))}
                disabled={disabled}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Off-peak Price</span>
              <input
                type="number"
                step="0.01"
                min={0}
                className={inputClass}
                value={request.pricing.offpeak_price}
                onChange={(event) => onPricingChange('offpeak_price', Number(event.target.value))}
                disabled={disabled}
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  )
}
