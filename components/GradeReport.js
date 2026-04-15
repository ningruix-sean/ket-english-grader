'use client'

const DIMENSIONS = [
  { key: 'pronunciation_score', label: '发音准确度', icon: '🗣️', labelEn: 'Pronunciation' },
  { key: 'fluency_score', label: '流利度', icon: '🌊', labelEn: 'Fluency' },
  { key: 'grammar_score', label: '语法正确性', icon: '📝', labelEn: 'Grammar' },
  { key: 'content_score', label: '内容完整度', icon: '💡', labelEn: 'Content' },
]

function scoreColor(score) {
  if (score >= 90) return { ring: 'ring-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-400', label: '优秀' }
  if (score >= 75) return { ring: 'ring-blue-400', text: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-400', label: '良好' }
  if (score >= 60) return { ring: 'ring-yellow-400', text: 'text-yellow-600', bg: 'bg-yellow-50', bar: 'bg-yellow-400', label: '及格' }
  return { ring: 'ring-red-400', text: 'text-red-500', bg: 'bg-red-50', bar: 'bg-red-400', label: '待提高' }
}

function ScoreRing({ score, size = 'lg' }) {
  const c = scoreColor(score)
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const dim = size === 'lg' ? 'w-28 h-28' : 'w-16 h-16'
  const svgSize = size === 'lg' ? 100 : 56
  const fontSize = size === 'lg' ? 'text-2xl' : 'text-sm'
  const r = size === 'lg' ? 40 : 22
  const circ = 2 * Math.PI * r
  const off = circ - (score / 100) * circ

  return (
    <div className={`relative ${dim} flex items-center justify-center`}>
      <svg width={svgSize} height={svgSize} className="-rotate-90" viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <circle
          cx={svgSize / 2} cy={svgSize / 2} r={r}
          fill="none" stroke="#e5e7eb" strokeWidth={size === 'lg' ? 8 : 5}
        />
        <circle
          cx={svgSize / 2} cy={svgSize / 2} r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={size === 'lg' ? 8 : 5}
          strokeDasharray={circ}
          strokeDashoffset={off}
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
        <div
          className={`h-full ${c.bar} rounded-full transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
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
    corrections = [],
    transcript,
  } = result

  const overall = scoreColor(overall_score)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header card */}
      <div className={`${overall.bg} rounded-3xl p-5 border-2 ${overall.ring.replace('ring-', 'border-')}`}>
        <div className="flex items-center gap-4">
          <ScoreRing score={overall_score} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-gray-500 text-sm">综合评分</p>
            <p className={`text-3xl font-extrabold ${overall.text}`}>{overall_score} <span className="text-lg">/ 100</span></p>
            <p className={`font-semibold mt-0.5 ${overall.text}`}>{overall.label}</p>
            {studentName && (
              <p className="text-sm text-gray-500 mt-1 truncate">
                {studentName}
                {studentClass ? ` · ${studentClass}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dimension scores */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <span>📊</span> 各项评分
        </h3>
        {DIMENSIONS.map(d => (
          <DimensionBar
            key={d.key}
            label={d.label}
            labelEn={d.labelEn}
            icon={d.icon}
            score={result[d.key]}
          />
        ))}
      </div>

      {/* Feedback */}
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

      {/* Corrections */}
      {corrections.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span>✏️</span> 错误纠正 <span className="text-xs text-gray-400 font-normal">({corrections.length} 处)</span>
          </h3>
          <div className="space-y-3">
            {corrections.map((c, i) => (
              <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="shrink-0 w-5 h-5 bg-amber-400 text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="line-through text-red-500 bg-red-50 px-2 py-0.5 rounded">
                        {c.original}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded font-medium">
                        {c.corrected}
                      </span>
                    </div>
                    {c.explanation_cn && (
                      <p className="text-xs text-gray-600">🇨🇳 {c.explanation_cn}</p>
                    )}
                    {c.explanation_en && (
                      <p className="text-xs text-gray-500 italic">EN: {c.explanation_en}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcript */}
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

      {/* Encouragement */}
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
