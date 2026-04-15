'use client'

import { useState } from 'react'

function ScoreBadge({ score }) {
  if (score == null) return <span className="text-gray-400">—</span>
  let cls = 'text-xs font-bold px-2 py-0.5 rounded-full '
  if (score >= 90) cls += 'bg-emerald-100 text-emerald-700'
  else if (score >= 75) cls += 'bg-blue-100 text-blue-700'
  else if (score >= 60) cls += 'bg-yellow-100 text-yellow-700'
  else cls += 'bg-red-100 text-red-600'
  return <span className={cls}>{score}</span>
}

function formatDate(dt) {
  if (!dt) return '—'
  const d = new Date(dt)
  return d.toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function SubmissionTable({ submissions, onRefresh }) {
  const [expanded, setExpanded] = useState(null)

  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📭</p>
        <p>暂无提交记录</p>
      </div>
    )
  }

  function toggleExpand(id) {
    setExpanded(prev => prev === id ? null : id)
  }

  return (
    <div className="space-y-2">
      {/* Desktop table header */}
      <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 rounded-xl">
        <span>学生</span>
        <span>班级</span>
        <span>作业</span>
        <span>发音</span>
        <span>流利</span>
        <span>语法</span>
        <span>内容</span>
        <span>总分</span>
        <span>时间</span>
      </div>

      {submissions.map((s) => {
        const corrections = (() => {
          try { return JSON.parse(s.corrections || '[]') } catch { return [] }
        })()

        return (
          <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Main row */}
            <button
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpand(s.id)}
            >
              {/* Mobile layout */}
              <div className="md:hidden flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{s.student_name}</p>
                  <p className="text-xs text-gray-400">{s.class_name} · {formatDate(s.submitted_at)}</p>
                  {s.assignment_title && (
                    <p className="text-xs text-blue-500 truncate">{s.assignment_title}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ScoreBadge score={s.overall_score} />
                  <span className={`text-gray-400 transition-transform ${expanded === s.id ? 'rotate-180' : ''}`}>▾</span>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 items-center text-sm">
                <span className="font-medium text-gray-800 truncate">{s.student_name}</span>
                <span className="text-gray-600 truncate">{s.class_name}</span>
                <span className="text-blue-500 text-xs truncate">{s.assignment_title || '—'}</span>
                <ScoreBadge score={s.pronunciation_score} />
                <ScoreBadge score={s.fluency_score} />
                <ScoreBadge score={s.grammar_score} />
                <ScoreBadge score={s.content_score} />
                <ScoreBadge score={s.overall_score} />
                <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(s.submitted_at)}</span>
              </div>
            </button>

            {/* Expanded detail */}
            {expanded === s.id && (
              <div className="border-t border-gray-100 px-4 py-4 space-y-3 bg-gray-50">
                {/* Mobile scores */}
                <div className="md:hidden grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: '发音', score: s.pronunciation_score },
                    { label: '流利', score: s.fluency_score },
                    { label: '语法', score: s.grammar_score },
                    { label: '内容', score: s.content_score },
                  ].map(d => (
                    <div key={d.label} className="bg-white rounded-xl p-2 border border-gray-100">
                      <p className="text-xs text-gray-500">{d.label}</p>
                      <ScoreBadge score={d.score} />
                    </div>
                  ))}
                </div>

                {/* Transcript */}
                {s.transcript && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">识别文本</p>
                    <p className="text-sm text-gray-700 bg-white rounded-xl p-3 border border-gray-100 leading-relaxed">
                      {s.transcript}
                    </p>
                  </div>
                )}

                {/* Feedback */}
                {s.feedback_cn && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">中文评语</p>
                    <p className="text-sm text-gray-700 bg-white rounded-xl p-3 border border-gray-100">
                      {s.feedback_cn}
                    </p>
                  </div>
                )}

                {/* Corrections */}
                {corrections.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">错误纠正 ({corrections.length})</p>
                    <div className="space-y-1.5">
                      {corrections.map((c, i) => (
                        <div key={i} className="text-xs bg-amber-50 rounded-lg p-2 flex items-start gap-2">
                          <span className="font-bold text-amber-600 shrink-0">#{i + 1}</span>
                          <span className="line-through text-red-500">{c.original}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-green-700 font-medium">{c.corrected}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400">提交时间：{new Date(s.submitted_at).toLocaleString('zh-CN')}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
