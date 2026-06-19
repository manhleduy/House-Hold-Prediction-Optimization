import { calculatePeakLoad, calculateWeightedCost, estimateEnergySavingsPct, slotToTime } from '../lib/energy'
import type { Appliance, ScheduleBlock } from '../types'

interface SummaryPanelProps {
  timeline: number[] | null
  optimizedTimeline: number[] | null
  appliances: Appliance[]
  blocks: ScheduleBlock[]
  score: number | null
  totalCost: number | null
  sourceLabel: string
}

const MetricCard = ({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'slate' | 'emerald' | 'cyan' | 'amber' }) => {
  const toneClasses = {
    slate: 'border-white/10 bg-white/5 text-slate-100',
    emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
    cyan: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100',
    amber: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
  }[tone]

  return (
    <div className={`rounded-3xl border p-4 ${toneClasses}`}>
      <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  )
}

export function SummaryPanel({ timeline, optimizedTimeline, appliances, blocks, score, totalCost, sourceLabel }: SummaryPanelProps) {
  const baselineCost = timeline ? Math.round(calculateWeightedCost(timeline) * 100) / 100 : null
  const savingsPct = baselineCost != null && totalCost != null ? estimateEnergySavingsPct(baselineCost, totalCost) : null
  const basePeak = timeline ? calculatePeakLoad(timeline) : null
  const optimizedPeak = optimizedTimeline ? calculatePeakLoad(optimizedTimeline) : null

  return (
    <aside className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Summary</h2>
          <p className="text-sm text-slate-400">Before vs after optimization, cost and schedule details.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
          {sourceLabel}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Energy Cost" value={totalCost == null ? '—' : `$${totalCost.toFixed(2)}`} tone="emerald" />
        <MetricCard label="Optimization Score" value={score == null ? '—' : score.toLocaleString()} tone="cyan" />
        <MetricCard label="Peak Load" value={optimizedPeak == null ? '—' : `${Math.round(optimizedPeak)} W`} tone="amber" />
        <MetricCard label="Savings" value={savingsPct == null ? '—' : `${savingsPct.toFixed(1)}%`} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-100">Comparison</h3>
          <dl className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-4">
              <dt>Baseline cost</dt>
              <dd className="font-semibold text-slate-100">{baselineCost == null ? '—' : `$${baselineCost.toFixed(2)}`}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Optimized cost</dt>
              <dd className="font-semibold text-slate-100">{totalCost == null ? '—' : `$${totalCost.toFixed(2)}`}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Peak before</dt>
              <dd className="font-semibold text-slate-100">{basePeak == null ? '—' : `${Math.round(basePeak)} W`}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Peak after</dt>
              <dd className="font-semibold text-slate-100">{optimizedPeak == null ? '—' : `${Math.round(optimizedPeak)} W`}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-100">Appliance Schedule</h3>
          <div className="space-y-3">
            {blocks.length ? (
              blocks.map((block) => (
                <div key={block.id} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-slate-950/50 p-3">
                  <span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: block.color }} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-100">{block.name}</div>
                    <div className="text-xs text-slate-400">
                      Start at {slotToTime(block.start)} for {Math.max(1, block.end - block.start)} slots
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Run optimization to see appliance placements.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
        {appliances.length} appliance{appliances.length === 1 ? '' : 's'} configured. {timeline ? 'Base load timeline generated.' : 'Generate a base load to begin.'}
      </div>
    </aside>
  )
}
