'use client'

import { useState, useEffect, useRef } from 'react'
import AudioRecorder from '@/components/AudioRecorder'
import GradeReport from '@/components/GradeReport'
import ProgressChart from '@/components/ProgressChart'

const STEPS = [
  { key: 'uploading',    label: '上传音频…',   icon: '⬆️' },
  { key: 'transcribing', label: '识别语音…',   icon: '🎧' },
  { key: 'grading',      label: 'AI 评分中…',  icon: '🤖' },
  { key: 'done',         label: '评分完成！',  icon: '✅' },
]

const PART_TYPE_LABELS = {
  part1: { label: 'Part 1 — 问答对话', icon: '🗣️', desc: '侧重流利度和自然度，回答日常生活问题' },
  part2: { label: 'Part 2 — 情景对话', icon: '💬', desc: '侧重交际能力，完成信息交换任务' },
  part3: { label: 'Part 3 — 看图描述', icon: '🖼️', desc: '侧重描述能力和词汇，描述图片并展开讨论' },
  free:  { label: '自由练习',          icon: '🎯', desc: '综合口语练习，不限定特定题型' },
}

function ProgressBar({ step }) {
  const idx = STEPS.findIndex(s => s.key === step)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1.5 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
              ${i < idx ? 'bg-green-500 text-white' :
                i === idx ? 'bg-blue-500 text-white animate-pulse' :
                'bg-gray-200 text-gray-400'}`}>
              {i < idx ? '✓' : s.icon}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < idx ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-sm font-medium text-blue-600">
        {STEPS.find(s => s.key === step)?.label}
      </p>
    </div>
  )
}

// ── Student history section ──────────────────────────────────────────────────

function StudentHistorySection({ studentName }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('records') // records | chart

  useEffect(() => {
    if (!studentName || studentName.trim().length < 1) {
      setHistory([])
      return
    }
    setLoading(true)
    const timer = setTimeout(() => {
      fetch(`/api/student-history?name=${encodeURIComponent(studentName.trim())}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          setHistory(Array.isArray(data) ? data : [])
          setTab('records')
        })
        .catch(() => setHistory([]))
        .finally(() => setLoading(false))
    }, 600)
    return () => clearTimeout(timer)
  }, [studentName])

  if (!studentName.trim()) return null
  if (!loading && history.length === 0) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <span>📈</span> 我的历史记录
          {history.length > 0 && (
            <span className="text-xs text-gray-400 font-normal">（共 {history.length} 次）</span>
          )}
        </h3>
        {history.length >= 2 && (
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setTab('records')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${tab === 'records' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-500'}`}
            >
              记录
            </button>
            <button
              onClick={() => setTab('chart')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${tab === 'chart' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-500'}`}
            >
              趋势图
            </button>
          </div>
        )}
      </div>

      {loading && (
        <p className="text-center text-sm text-gray-400 py-4">加载中…</p>
      )}

      {!loading && tab === 'records' && (
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto] gap-2 px-1 pb-1 text-xs font-semibold text-gray-400">
            <span>日期 · 作业</span>
            <span className="text-right">发音/流利/语法/内容 · 总分</span>
          </div>
          {history.map(h => {
            const sc = h.overall_score
            const badge = sc >= 90 ? 'bg-emerald-100 text-emerald-700' :
                          sc >= 75 ? 'bg-blue-100 text-blue-700' :
                          sc >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                     'bg-red-100 text-red-600'
            return (
              <div key={h.id} className="grid grid-cols-[1fr_auto] gap-2 items-center py-1.5 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">
                    {new Date(h.submitted_at).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                    {h.assignment_title && <span className="ml-1 text-blue-400">· {h.assignment_title}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-xs text-gray-400">
                  <span>{h.pronunciation_score}</span>
                  <span className="text-gray-200">/</span>
                  <span>{h.fluency_score}</span>
                  <span className="text-gray-200">/</span>
                  <span>{h.grammar_score}</span>
                  <span className="text-gray-200">/</span>
                  <span>{h.content_score}</span>
                  <span className={`ml-1.5 px-2 py-0.5 rounded-full font-bold text-xs ${badge}`}>{sc}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && tab === 'chart' && (
        <ProgressChart history={history} height={200} />
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function StudentPage() {
  const [studentName, setStudentName] = useState('')
  const [className, setClassName] = useState('')
  const [assignments, setAssignments] = useState([])
  const [selectedAssignment, setSelectedAssignment] = useState('')
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioFilename, setAudioFilename] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [progressStep, setProgressStep] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const resultRef = useRef(null)

  // Load assignments when class changes
  useEffect(() => {
    if (!className.trim()) return
    fetch(`/api/assignments?class=${encodeURIComponent(className)}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setAssignments(Array.isArray(data) ? data : []))
      .catch(() => setAssignments([]))
  }, [className])

  // Scroll to result
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  function handleRecordingReady(blob, filename) {
    setAudioBlob(blob)
    setAudioFilename(filename)
    setUploadedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFile(file)
    setAudioBlob(null)
    setAudioFilename(null)
  }

  const hasAudio = audioBlob || uploadedFile
  const canSubmit = studentName.trim() && className.trim() && hasAudio && !submitting

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    setError(null)
    setResult(null)
    setSubmitting(true)
    setProgressStep('uploading')

    try {
      const formData = new FormData()
      formData.append('studentName', studentName.trim())
      formData.append('className', className.trim())
      if (selectedAssignment) formData.append('assignmentId', selectedAssignment)

      if (audioBlob) {
        formData.append('audio', audioBlob, audioFilename || 'recording.webm')
      } else if (uploadedFile) {
        formData.append('audio', uploadedFile, uploadedFile.name)
      }

      const stepTimer = setTimeout(() => setProgressStep('transcribing'), 1500)
      const stepTimer2 = setTimeout(() => setProgressStep('grading'), 4000)

      const res = await fetch('/api/grade', { method: 'POST', body: formData })
      clearTimeout(stepTimer)
      clearTimeout(stepTimer2)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `服务器错误 (${res.status})`)
      }

      setProgressStep('done')
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message || '提交失败，请稍后再试')
    } finally {
      setSubmitting(false)
      if (!result) setProgressStep(null)
    }
  }

  function handleReset() {
    setResult(null)
    setProgressStep(null)
    setAudioBlob(null)
    setAudioFilename(null)
    setUploadedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Currently selected assignment object
  const selectedAssignmentObj = assignments.find(x => x.id === Number(selectedAssignment))

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-blue-600">🎙️ KET 口语练习</h1>
            <p className="text-xs text-gray-400">智能评分系统</p>
          </div>
          <a href="/teacher" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            教师登录
          </a>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-20">
        {/* Welcome */}
        {!result && (
          <div className="text-center py-2">
            <p className="text-3xl mb-1">👋</p>
            <h2 className="text-xl font-bold text-gray-800">你好！准备好了吗？</h2>
            <p className="text-sm text-gray-500 mt-1">录制你的英语口语，AI 将帮你评分并给出建议</p>
          </div>
        )}

        {/* Form */}
        {!result && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <h3 className="font-semibold text-gray-700">📋 基本信息</h3>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  姓名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="请输入你的姓名"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-base"
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  班级 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  placeholder="例如：五年级3班"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-base"
                  disabled={submitting}
                  required
                />
              </div>

              {/* Assignment selector */}
              {assignments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    作业题目 <span className="text-gray-400 font-normal">(可选)</span>
                  </label>
                  <select
                    value={selectedAssignment}
                    onChange={e => setSelectedAssignment(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-base bg-white"
                    disabled={submitting}
                  >
                    <option value="">— 自由练习 —</option>
                    {assignments.map(a => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>

                  {selectedAssignmentObj && (() => {
                    const ptInfo = PART_TYPE_LABELS[selectedAssignmentObj.part_type] || PART_TYPE_LABELS.free
                    return (
                      <div className="mt-2 space-y-2">
                        {/* Part type badge */}
                        <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2">
                          <span className="text-base">{ptInfo.icon}</span>
                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-indigo-700">{ptInfo.label}</span>
                            <p className="text-xs text-indigo-400 mt-0.5">{ptInfo.desc}</p>
                          </div>
                        </div>
                        {/* Reference text */}
                        {selectedAssignmentObj.reference_text && (
                          <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
                            <p className="font-medium mb-1">📖 题目内容：</p>
                            <p className="leading-relaxed">{selectedAssignmentObj.reference_text}</p>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Audio input */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <h3 className="font-semibold text-gray-700">🎤 录制或上传音频</h3>

              <div>
                <p className="text-xs text-gray-500 mb-2">方式一：直接录音</p>
                <AudioRecorder
                  onAudioReady={handleRecordingReady}
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center gap-3 text-gray-300">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs">或</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">方式二：上传音频文件</p>
                <label className={`flex flex-col items-center justify-center gap-2 w-full py-5 px-4 border-2 border-dashed rounded-2xl cursor-pointer transition-colors
                  ${uploadedFile ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}
                  ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <span className="text-2xl">{uploadedFile ? '✅' : '📁'}</span>
                  <span className="text-sm text-gray-600 font-medium">
                    {uploadedFile ? uploadedFile.name : '点击选择音频文件'}
                  </span>
                  <span className="text-xs text-gray-400">支持 MP3、WAV、M4A、WebM 等格式，最大 25MB</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.mp4,.aac,.flac"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={submitting}
                  />
                </label>
                {uploadedFile && !submitting && (
                  <button
                    type="button"
                    onClick={() => { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="text-xs text-gray-400 hover:text-gray-600 underline mt-1 w-full text-center"
                  >
                    移除文件
                  </button>
                )}
              </div>
            </div>

            {/* Progress */}
            {submitting && progressStep && (
              <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5">
                <ProgressBar step={progressStep} />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-xl shrink-0">⚠️</span>
                <div>
                  <p className="font-medium">提交失败</p>
                  <p className="text-sm mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-lg rounded-2xl shadow-md transition-all active:scale-95 disabled:cursor-not-allowed"
            >
              {submitting ? '评分中…' : '🚀 提交评分'}
            </button>

            {!hasAudio && (
              <p className="text-center text-xs text-gray-400">请先录音或上传音频文件</p>
            )}
          </form>
        )}

        {/* ── Student history section (always visible once name entered) ── */}
        {!result && (
          <StudentHistorySection studentName={studentName} />
        )}

        {/* Results */}
        {result && (
          <div ref={resultRef} className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">评分报告</h2>
              <button
                onClick={handleReset}
                className="text-sm text-blue-500 hover:text-blue-700 font-medium"
              >
                再练一次 →
              </button>
            </div>
            <GradeReport
              result={result}
              studentName={studentName}
              className={className}
            />
            {/* Show updated history after submission */}
            <StudentHistorySection studentName={studentName} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400">
        KET 英语口语智能评分系统 · Powered by OpenAI
      </footer>
    </div>
  )
}
