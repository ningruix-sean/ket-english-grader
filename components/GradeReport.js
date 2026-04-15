'use client'

const DIMENSIONS = [
  { key: 'pronunciation_score', label: '发音准确度', icon: '🗣️', labelEn: 'Pronunciation' },
  { key: 'fluency_score',       label: '流利度',     icon: '🌊', labelEn: 'Fluency' },
  { key: 'grammar_score',       label: '语法正确性', icon: '📝', labelEn: 'Grammar' },
  { key: 'content_score',       label: '内容完整度', icon: '💡', labelEn: 'Content' },
]

function scoreColor(score) {
  if (score >= 90) return { ring: 'ring-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-400', label: '优秀' }
  if (score >= 75) return { ring: 'ring-blue-400',    text: 'text-blue-600',    bg: 'bg-blue-50',    bar: 'bg-blue-400',    label: '良好' }
  if (score >= 60) return { ring: 'ring-yellow-400',  text: 'text-yellow-600',  bg: 'bg-yellow-50',  bar: 'bg-yellow-400',  label: '及格' }
  return             { ring: 'ring-red-400',     text: 'text-red-500',     bg: 'bg-red-50',     bar: 'bg-red-400',     label: '待提高' }
}

function ScoreRing({ score, size = 'lg' }) {
  const c = scoreColor(score)
  const svgSize = size === 'lg' ? 100 : 56
  const r = size === 'lg' ? 40 : 22
  const circ = 2 * Math.PI * r
  const off = circ - (score / 100) * circ
  const dim = size === 'lg' ? 'w-28 h-28' : 'w-16 h-16'
  const fontSize = size === 'lg' ? 'text-2xl' : 'text-sm'
  return (
    <div className={`relative ${dim} flex items-center justify-center`}>
      <svg width={svgSize} height={svgSize} className="-rotate-90" viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <circle cx={svgSize / 2} cy={svgSize / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={size === 'lg' ? 8 : 5} />
        <circle
          cx={svgSize / 2} cy={svgSize / 2} r={r}
          fill="none" stroke="currentColor"
          strokeWidth={size === 'lg' ? 8 : 5}
          strokeDasharray={circ} strokeDashoffset={off}
          strokeLinecap="round"
          className={`${c.text} transition-all duration-700`}
        />
      </svg>
      <div className={`absolute inset-0 flex flex-col items-center justify-center ${c.text}`}>
        <span className={`font-bold ${fontSize}`}>{score}</span>
        {size === 'lg' && <span className="text-xs font-medium">{c.label}</span>}
      </div>
    </div>
  )
}

function DimensionBar({ label, labelEn, icon, score }) {
  const c = scoreColor(score)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <span>{icon}</span>
          <span>{label}</span>
          <span className="text-gray-400 text-xs">({labelEn})</span>
        </span>
        <span className={`text-sm font-bold ${c.text}`}>{score}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${c.bar} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function speakText(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'en-US'
  utt.rate = 0.9
  window.speechSynthesis.speak(utt)
}

export default function GradeReport({ result, studentName, className: studentClass }) {
  if (!result) return null

  const {
    overall_score,
    pronunciation_score,
    fluency_score,
    grammar_score,
    content_score,
    feedback_en,
    feedback_cn,
    transcript,
  } = result

  // Handle corrections — may be JSON string (from DB) or array (fresh from API)
  const corrections = (() => {
    const raw = result.corrections
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    try { return JSON.parse(raw) } catch { return [] }
  })()

  // Handle practice_suggestions — may be JSON string or array
  const practiceSuggestions = (() => {
    const raw = result.practice_suggestions
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    try { return JSON.parse(raw) } catch { return [] }
  })()

  const overall = scoreColor(overall_score)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header card ─────────────────────────────────────────── */}
      <div className={`${overall.bg} rounded-3xl p-5 border-2 ${overall.ring.replace('ring-', 'border-')}`}>
        <div className="flex items-center gap-4">
          <ScoreRing score={overall_score} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-gray-500 text-sm">综合评分</p>
            <p className={`text-3xl font-extrabold ${overall.text}`}>
              {overall_score} <span className="text-lg">/ 100</span>
            </p>
            <p className={`font-semibold mt-0.5 ${overall.text}`}>{overall.label}</p>
            {studentName && (
              <p className="text-sm text-gray-500 mt-1 truncate">
                {studentName}{studentClass ? ` · ${studentClass}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Dimension scores ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <span>📊</span> 各项评分
        </h3>
        {DIMENSIONS.map(d => (
          <DimensionBar key={d.key} label={d.label} labelEn={d.labelEn} icon={d.icon} score={result[d.key]} />
        ))}
      </div>

      {/* ── Feedback ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <span>💬</span> 老师评语
        </h3>
        {feedback_cn && (
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-700 mb-1">中文点评</p>
            <p className="text-gray-700 text-sm leading-relaxed">{feedback_cn}</p>
          </div>
        )}
        {feedback_en && (
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-500 mb-1">English Feedback</p>
            <p className="text-gray-600 text-sm leading-relaxed italic">{feedback_en}</p>
          </div>
        )}
      </div>

      {/* ── Corrections — card layout ─────────────────────────────── */}
      {corrections.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span>✏️</span> 错误纠正
            <span className="text-xs text-gray-400 font-normal">({corrections.length} 处)</span>
          </h3>
          <div className="space-y-3">
            {corrections.map((c, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                {/* Left = error (red), Right = corrected (green) */}
                <div className="grid grid-cols-2">
                  <div className="bg-red-50 p-3 border-r border-red-100">
                    <p className="text-xs text-red-400 font-medium mb-1.5">❌ 原文错误</p>
                    <p className="text-sm text-red-700 line-through leading-relaxed break-words">{c.original}</p>
                  </div>
                  <div className="bg-green-50 p-3">
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <p className="text-xs text-green-500 font-medium">✅ 正确表达</p>
                      <button
                        type="button"
                        onClick={() => speakText(c.corrected)}
                        className="shrink-0 text-green-500 hover:text-green-700 active:scale-90 transition text-base leading-none"
                        title="朗读正确版本"
                        aria-label="朗读正确版本"
                      >
                        🔊
                      </button>
                    </div>
                    <p className="text-sm text-green-700 font-medium leading-relaxed break-words">{c.corrected}</p>
                  </div>
                </div>
                {(c.explanation_cn || c.explanation_en) && (
                  <div className="bg-white px-3 py-2.5 border-t border-gray-100 space-y-1">
                    {c.explanation_cn && (
                      <p className="text-xs text-gray-600">🇨🇳 {c.explanation_cn}</p>
                    )}
                    {c.explanation_en && (
                      <p className="text-xs text-gray-400 italic">EN: {c.explanation_en}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Practice suggestions ─────────────────────────────────── */}
      {practiceSuggestions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span>💪</span> 练习建议
          </h3>
          <div className="space-y-3">
            {practiceSuggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-gray-700 leading-relaxed">{s.suggestion_cn}</p>
                  {s.suggestion_en && (
                    <p className="text-xs text-gray-400 italic mt-0.5">{s.suggestion_en}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Transcript (collapsible) ──────────────────────────────── */}
      {transcript && (
        <details className="bg-gray-50 rounded-2xl border border-gray-100">
          <summary className="p-4 cursor-pointer text-sm font-medium text-gray-600 flex items-center gap-2">
            <span>📄</span> 查看识别文本
          </summary>
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-600 leading-relaxed bg-white rounded-xl p-3 border border-gray-100">
              {transcript}
            </p>
          </div>
        </details>
      )}

      {/* ── Encouragement ────────────────────────────────────────── */}
      <div className="text-center py-2">
        <p className="text-2xl">
          {overall_score >= 80 ? '🌟🎉' : overall_score >= 60 ? '👍💪' : '🤗📚'}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {overall_score >= 80
            ? '太棒了！继续保持！'
            : overall_score >= 60
            ? '做得不错！多练习，你会越来越好！'
            : '没关系，多听多说，进步一定很快！'}
        </p>
      </div>
    </div>
  )
}
