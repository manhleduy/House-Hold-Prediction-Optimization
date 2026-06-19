import type { Appliance } from '../types'

interface ApplianceFormProps {
  appliances: Appliance[]
  onAdd: () => void
  onRemove: (id: string) => void
  onChange: <K extends keyof Omit<Appliance, 'id'>>(id: string, field: K, value: Appliance[K]) => void
  disabled?: boolean
}

const inputClass =
  'w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/80 focus:ring-2 focus:ring-cyan-400/20'

export function ApplianceForm({ appliances, onAdd, onRemove, onChange, disabled }: ApplianceFormProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Appliances</h2>
          <p className="text-sm text-slate-400">Add the loads you want the optimizer to schedule.</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
        >
          Add Appliance
        </button>
      </div>

      <div className="space-y-4">
        {appliances.map((appliance, index) => (
          <article key={appliance.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    background:
                      ['#22c55e', '#06b6d4', '#f59e0b', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6'][index % 7],
                  }}
                />
                <h3 className="text-sm font-semibold text-slate-100">Appliance {index + 1}</h3>
              </div>
              <button
                type="button"
                onClick={() => onRemove(appliance.id)}
                className="text-sm text-rose-300 transition hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disabled || appliances.length === 1}
              >
                Remove
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <label className="xl:col-span-2">
                <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Name</span>
                <input
                  className={inputClass}
                  type="text"
                  value={appliance.name}
                  onChange={(event) => onChange(appliance.id, 'name', event.target.value)}
                  placeholder="Washing Machine"
                  disabled={disabled}
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Power (W)</span>
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  value={appliance.power}
                  onChange={(event) => onChange(appliance.id, 'power', Number(event.target.value))}
                  disabled={disabled}
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Duration</span>
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  max={144}
                  value={appliance.duration}
                  onChange={(event) => onChange(appliance.id, 'duration', Number(event.target.value))}
                  disabled={disabled}
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Preferred Start</span>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  max={143}
                  value={appliance.preferred_start}
                  onChange={(event) => onChange(appliance.id, 'preferred_start', Number(event.target.value))}
                  disabled={disabled}
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Preferred End</span>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  max={143}
                  value={appliance.preferred_end}
                  onChange={(event) => onChange(appliance.id, 'preferred_end', Number(event.target.value))}
                  disabled={disabled}
                />
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
