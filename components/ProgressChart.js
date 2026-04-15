'use client'

import { useRef, useEffect } from 'react'

const DATASETS_CONFIG = [
  { key: 'pronunciation_score', label: '发音', color: '#f59e0b' },
  { key: 'fluency_score',       label: '流利', color: '#3b82f6' },
  { key: 'grammar_score',       label: '语法', color: '#10b981' },
  { key: 'content_score',       label: '内容', color: '#8b5cf6' },
  { key: 'overall_score',       label: '总分', color: '#ef4444', borderWidth: 2, fill: true },
]

/**
 * Renders a Chart.js line chart from student history data.
 * Requires Chart.js to be loaded globally (via CDN in layout.js).
 *
 * @param {{ history: Array, height?: number }} props
 *   history — array of submission objects ordered by date ASC
 */
export default function ProgressChart({ history, height = 220 }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !history || history.length < 2) return

    function buildChart() {
      if (typeof window === 'undefined' || !window.Chart) return false

      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }

      const labels = history.map((h, i) => {
        const d = new Date(h.submitted_at)
        return `${d.getMonth() + 1}/${d.getDate()}（#${i + 1}）`
      })

      chartRef.current = new window.Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: DATASETS_CONFIG.map(cfg => ({
            label: cfg.label,
            data: history.map(h => h[cfg.key]),
            borderColor: cfg.color,
            backgroundColor: cfg.fill ? `${cfg.color}18` : 'transparent',
            fill: cfg.fill || false,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: cfg.borderWidth || 1.5,
            tension: 0.3,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 10, padding: 12, font: { size: 11 } },
            },
            tooltip: { mode: 'index', intersect: false },
          },
          scales: {
            y: {
              min: 0,
              max: 100,
              ticks: { stepSize: 20, font: { size: 10 } },
              grid: { color: '#f1f5f9' },
            },
            x: {
              ticks: { font: { size: 10 }, maxRotation: 30 },
              grid: { display: false },
            },
          },
        },
      })
      return true
    }

    if (!buildChart()) {
      // Chart.js CDN not yet loaded — retry until available
      const id = setInterval(() => {
        if (buildChart()) clearInterval(id)
      }, 100)
      return () => {
        clearInterval(id)
        if (chartRef.current) chartRef.current.destroy()
      }
    }

    return () => {
      if (chartRef.current) chartRef.current.destroy()
    }
  }, [history])

  if (!history || history.length < 2) {
    return (
      <p className="text-center text-sm text-gray-400 py-6">
        至少需要 2 次提交才能显示进步趋势图
      </p>
    )
  }

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
