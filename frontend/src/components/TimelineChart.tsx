import { useMemo } from 'react'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type Plugin,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { buildScheduleBlocks, calculatePeakLoad, slotToHourLabel } from '../lib/energy'
import type { Appliance, ScheduleBlock } from '../types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

interface TimelineChartProps {
  timeline: number[] | null
  optimizedTimeline: number[] | null
  appliances: Appliance[]
  schedule: Record<string, number> | null
  loading?: boolean
}

const createUsageOverlayPlugin = (blocks: ScheduleBlock[]): Plugin<'line'> => ({
  id: 'usageOverlay',
  afterDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart
    const xScale = scales.x

    if (!xScale || !blocks.length) {
      return
    }

    const slotWidth = Math.abs(xScale.getPixelForValue(1) - xScale.getPixelForValue(0)) || 1

    ctx.save()

    for (const block of blocks) {
      const left = Math.max(chartArea.left, xScale.getPixelForValue(block.start) - slotWidth / 2)
      const right = Math.min(chartArea.right, xScale.getPixelForValue(Math.max(block.end - 1, block.start)) + slotWidth / 2)
      const width = Math.max(1, right - left)

      ctx.fillStyle = `${block.color}24`
      ctx.fillRect(left, chartArea.top, width, chartArea.bottom - chartArea.top)

      ctx.fillStyle = block.color
      ctx.font = '12px Segoe UI, sans-serif'
      ctx.fillText(block.name, left + 6, chartArea.top + 14)
    }

    ctx.restore()
  },
})

export function TimelineChart({ timeline, optimizedTimeline, appliances, schedule, loading }: TimelineChartProps) {
  const blocks = useMemo(() => {
    if (!schedule) {
      return []
    }

    return buildScheduleBlocks(appliances, schedule)
  }, [appliances, schedule])

  const chartData = useMemo<ChartData<'line'>>(
    () => ({
      labels: Array.from({ length: 144 }, (_, index) => index),
      datasets: [
        {
          label: 'Base Load',
          data: timeline ?? [],
          borderColor: 'rgba(148, 163, 184, 0.9)',
          backgroundColor: 'rgba(148, 163, 184, 0.12)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35,
          fill: false,
        },
        {
          label: 'Optimized Load',
          data: optimizedTimeline ?? [],
          borderColor: 'rgba(45, 212, 191, 1)',
          backgroundColor: 'rgba(45, 212, 191, 0.14)',
          borderWidth: 3,
          pointRadius: 0,
          tension: 0.35,
          fill: false,
        },
      ],
    }),
    [optimizedTimeline, timeline],
  )

  const chartOptions = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 650,
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            color: '#cbd5e1',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(2, 6, 23, 0.95)',
          borderColor: 'rgba(148, 163, 184, 0.25)',
          borderWidth: 1,
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          displayColors: true,
          callbacks: {
            title: (items) => {
              const slot = Number(items[0]?.label ?? 0)

              return `Slot ${slot} · ${slotToHourLabel(slot)}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(148, 163, 184, 0.12)',
          },
          ticks: {
            color: '#94a3b8',
            autoSkip: false,
            maxRotation: 0,
            callback: (_value, index) => (index % 6 === 0 ? `${index / 6}` : ''),
          },
          title: {
            display: true,
            text: 'Hour of Day',
            color: '#cbd5e1',
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(148, 163, 184, 0.12)',
          },
          ticks: {
            color: '#94a3b8',
          },
          title: {
            display: true,
            text: 'Power Consumption',
            color: '#cbd5e1',
          },
        },
      },
    }),
    [],
  )

  const peakLoad = useMemo(() => calculatePeakLoad(optimizedTimeline ?? timeline ?? []), [optimizedTimeline, timeline])

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Timeline</h2>
          <p className="text-sm text-slate-400">Base load and optimized load across 24 hours.</p>
        </div>
        <div className="text-sm text-slate-400">
          Peak load: <span className="font-semibold text-slate-100">{Math.round(peakLoad)} W</span>
        </div>
      </div>

      <div className="h-[420px]">
        {loading ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-sm text-slate-400">
            Building chart...
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} plugins={[createUsageOverlayPlugin(blocks)]} />
        )}
      </div>
    </section>
  )
}
