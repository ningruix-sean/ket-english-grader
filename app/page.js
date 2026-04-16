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
  const [tab, setTab] = useState('records')

  useEffect(() => {
    if (!studentName || studentName.trim().length < 1) {
      setHistory([])
      return
    }
    setLoading(true)
    const timer = setTimeout(() => {
      fetch(`/api/student-history?name=${encodeURIComponent(studentName.trim())}`, {
          headers: { 'x-student-token': btoa(studentName.trim()) },
        })
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

// ── Class selection screen ──────────────────────────────────────────────────

function ClassSelectScreen({ onSelect }) {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/classes')
      .then(r => r.ok ? r.json() : [])
      .then(data => setClasses(Array.isArray(data) ? data : []))
      .catch(() => setClasses([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50">
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
      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="text-center py-4">
          <p className="text-4xl mb-2">🏫</p>
          <h2 className="text-xl font-bold text-gray-800">选择你的班级</h2>
          <p className="text-sm text-gray-500 mt-1">选择后可查看班级作业</p>
        </div>

        {loading && <p className="text-center text-gray-400 text-sm">加载中…</p>}

        {!loading && classes.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-gray-400 mb-4">暂无班级，请联系老师创建</p>
            <button
              onClick={() => onSelect(null)}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition"
            >
              直接进入自由练习
            </button>
          </div>
        )}

        {!loading && classes.length > 0 && (
          <div className="space-y-3">
            {classes.map(c => (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.98]"
              >
                <h3 className="font-semibold text-gray-800 text-lg">{c.name}</h3>
                <p className="text-xs text-gray-400 mt-1">点击进入</p>
              </button>
            ))}
            <div className="text-center pt-4">
              <button
                onClick={() => onSelect(null)}
                className="text-sm text-gray-400 hover:text-blue-500 underline transition"
              >
                跳过，直接自由练习
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Homework list screen ────────────────────────────────────────────────────

function CreditsBadge({ credits }) {
  if (credits === null || credits === undefined) return null
  const color = credits <= 0 ? 'bg-red-100 text-red-600' :
                credits <= 5 ? 'bg-orange-100 text-orange-600' :
                               'bg-green-100 text-green-700'
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${color}`}>
      剩余额度：{credits} 次
    </span>
  )
}

function HomeworkListScreen({ selectedClass, onSelectHomework, onFreePractice, onChangeClass, credits, studentName }) {
  const [homeworkList, setHomeworkList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedClass) { setLoading(false); return }
    fetch(`/api/homework?class_id=${selectedClass.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setHomeworkList(Array.isArray(data) ? data : []))
      .catch(() => setHomeworkList([]))
      .finally(() => setLoading(false))
  }, [selectedClass])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-blue-600">🎙️ KET 口语练习</h1>
            <p className="text-xs text-gray-400">{selectedClass?.name || '自由练习'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onChangeClass} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              切换班级
            </button>
            <a href="/teacher" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              教师登录
            </a>
          </div>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-20">
        {/* Credits display */}
        {credits !== null && credits !== undefined && (
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3">
            <span className="text-sm text-gray-600">
              {studentName ? `${studentName}，` : ''}你好！
            </span>
            <CreditsBadge credits={credits} />
          </div>
        )}

        <div className="text-center py-2">
          <p className="text-3xl mb-1">📚</p>
          <h2 className="text-xl font-bold text-gray-800">{selectedClass?.name}</h2>
          <p className="text-sm text-gray-500 mt-1">选择作业开始练习</p>
        </div>

        {loading && <p className="text-center text-gray-400 text-sm">加载中…</p>}

        {!loading && homeworkList.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-gray-400 mb-2">暂无作业</p>
            <p className="text-xs text-gray-300">老师还没有布置作业，可以先自由练习</p>
          </div>
        )}

        {!loading && homeworkList.map(hw => {
          let qCount = 0
          try { qCount = JSON.parse(hw.question_ids).length } catch {}
          return (
            <button
              key={hw.id}
              onClick={() => onSelectHomework(hw)}
              className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{hw.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{qCount} 道题 · {new Date(hw.created_at).toLocaleDateString('zh-CN')}</p>
                </div>
                {hw.due_date && (
                  <span className="text-xs text-orange-400 shrink-0">截止 {hw.due_date}</span>
                )}
              </div>
            </button>
          )
        })}

        <div className="pt-2">
          <button
            onClick={onFreePractice}
            className="w-full py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-base rounded-2xl transition-all active:scale-95"
          >
            🎯 自由练习模式
          </button>
        </div>
      </main>
    </div>
  )
}

// ── Homework question list + practice screen ────────────────────────────────

function HomeworkPracticeScreen({ homework, studentName, studentId, credits, onCreditsUpdate, onBack }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeQuestion, setActiveQuestion] = useState(null)
  const [completedQuestions, setCompletedQuestions] = useState({}) // qid -> result

  useEffect(() => {
    fetch(`/api/homework/${homework.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [homework.id])

  function handleQuestionDone(questionId, result) {
    setCompletedQuestions(prev => ({ ...prev, [questionId]: result }))
    setActiveQuestion(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50 flex items-center justify-center">
        <p className="text-gray-400">加载中…</p>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50 flex items-center justify-center">
        <p className="text-red-400">加载失败</p>
      </div>
    )
  }

  if (activeQuestion) {
    return (
      <QuestionPracticeScreen
        homeworkId={homework.id}
        question={activeQuestion}
        studentName={studentName}
        studentId={studentId}
        credits={credits}
        onCreditsUpdate={onCreditsUpdate}
        onDone={(result) => handleQuestionDone(activeQuestion.id, result)}
        onBack={() => setActiveQuestion(null)}
      />
    )
  }

  const questions = detail.questions || []
  const completedCount = Object.keys(completedQuestions).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="text-sm text-blue-500 hover:text-blue-700">&larr; 返回</button>
          <div className="text-center">
            <h1 className="text-sm font-bold text-gray-800">{homework.title}</h1>
            <p className="text-xs text-gray-400">{completedCount}/{questions.length} 已完成</p>
          </div>
          <CreditsBadge credits={credits} />
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-3 pb-20">
        {/* Progress indicator */}
        {questions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">完成进度</span>
              <span className="text-sm font-bold text-blue-600">{completedCount}/{questions.length}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${questions.length > 0 ? (completedCount / questions.length * 100) : 0}%` }}
              />
            </div>
          </div>
        )}

        {questions.map((q, idx) => {
          const done = completedQuestions[q.id]
          return (
            <button
              key={q.id}
              onClick={() => setActiveQuestion(q)}
              className={`w-full bg-white rounded-2xl shadow-sm border p-4 text-left transition-all active:scale-[0.98] ${
                done ? 'border-green-200 bg-green-50/30' : 'border-gray-100 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {done ? '✓' : idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800">{q.examiner_question}</p>
                  {done && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        done.overall_score >= 90 ? 'bg-emerald-100 text-emerald-700' :
                        done.overall_score >= 75 ? 'bg-blue-100 text-blue-700' :
                        done.overall_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {done.overall_score} 分
                      </span>
                      <span className="text-xs text-gray-400">点击重新练习</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </main>
    </div>
  )
}

// ── Single question practice screen ─────────────────────────────────────────

function QuestionPracticeScreen({ homeworkId, question, studentName, studentId, credits, onCreditsUpdate, onDone, onBack }) {
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioFilename, setAudioFilename] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [progressStep, setProgressStep] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const gotResultRef = useRef(false)

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
  const noCredits = credits !== null && credits !== undefined && credits <= 0
  const canSubmit = hasAudio && !submitting && !noCredits

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    setError(null)
    setResult(null)
    gotResultRef.current = false
    setSubmitting(true)
    setProgressStep('uploading')

    try {
      const formData = new FormData()
      formData.append('studentName', studentName)
      formData.append('questionId', question.id)
      if (studentId) formData.append('studentId', studentId)

      if (audioBlob) {
        formData.append('audio', audioBlob, audioFilename || 'recording.webm')
      } else if (uploadedFile) {
        formData.append('audio', uploadedFile, uploadedFile.name)
      }

      const stepTimer = setTimeout(() => setProgressStep('transcribing'), 1500)
      const stepTimer2 = setTimeout(() => setProgressStep('grading'), 4000)

      const res = await fetch(`/api/homework/${homeworkId}/submit`, { method: 'POST', body: formData })
      clearTimeout(stepTimer)
      clearTimeout(stepTimer2)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `服务器错误 (${res.status})`)
      }

      setProgressStep('done')
      const data = await res.json()
      gotResultRef.current = true
      setResult(data)

      // Update credits from response
      if (data.credits !== undefined && onCreditsUpdate) {
        onCreditsUpdate(data.credits)
      }
    } catch (err) {
      setError(err.message || '提交失败，请稍后再试')
    } finally {
      setSubmitting(false)
      if (!gotResultRef.current) setProgressStep(null)
    }
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => onDone(result)} className="text-sm text-blue-500 hover:text-blue-700">&larr; 返回题目列表</button>
            <div className="w-12" />
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-20">
          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="text-sm font-medium text-blue-700 mb-1">考官提问：</p>
            <p className="text-blue-800">{question.examiner_question}</p>
          </div>
          <GradeReport result={result} studentName={studentName} className="" />
          <button
            onClick={() => onDone(result)}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-2xl transition"
          >
            返回题目列表
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="text-sm text-blue-500 hover:text-blue-700">&larr; 返回</button>
          <div className="w-12" />
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-20">
        {/* Question prompt */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-5">
          <p className="text-xs text-blue-400 font-medium mb-2">考官提问：</p>
          <p className="text-lg font-semibold text-gray-800">{question.examiner_question}</p>
          <div className="mt-3 bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">参考回答：</p>
            <p className="text-sm text-gray-600">{question.reference_answer}</p>
          </div>
        </div>

        {/* Audio input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h3 className="font-semibold text-gray-700">🎤 录制你的回答</h3>

            <div>
              <p className="text-xs text-gray-500 mb-2">方式一：直接录音</p>
              <AudioRecorder onAudioReady={handleRecordingReady} disabled={submitting} />
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

          {submitting && progressStep && (
            <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5">
              <ProgressBar step={progressStep} />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-xl shrink-0">⚠️</span>
              <div>
                <p className="font-medium">提交失败</p>
                <p className="text-sm mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {noCredits && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-center">
              <p className="font-semibold">额度已用完</p>
              <p className="text-sm mt-1">请联系老师充值（6 元 = 100 次）</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-lg rounded-2xl shadow-md transition-all active:scale-95 disabled:cursor-not-allowed"
          >
            {submitting ? '评分中…' : '🚀 提交评分'}
          </button>
        </form>
      </main>
    </div>
  )
}

// ── Free practice mode (original flow) ──────────────────────────────────────

function FreePracticeScreen({ onBack, initialClass, studentId: initialStudentId, credits: initialCredits, onCreditsUpdate }) {
  const [studentName, setStudentName] = useState('')
  const [className, setClassName] = useState(initialClass || '')
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
  const gotResultRef = useRef(false)

  useEffect(() => {
    if (!className.trim()) return
    fetch(`/api/assignments?class=${encodeURIComponent(className)}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setAssignments(Array.isArray(data) ? data : []))
      .catch(() => setAssignments([]))
  }, [className])

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
  const noCredits = initialCredits !== null && initialCredits !== undefined && initialCredits <= 0
  const canSubmit = studentName.trim() && className.trim() && hasAudio && !submitting && !noCredits

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    setError(null)
    setResult(null)
    gotResultRef.current = false
    setSubmitting(true)
    setProgressStep('uploading')

    try {
      const formData = new FormData()
      formData.append('studentName', studentName.trim())
      formData.append('className', className.trim())
      if (selectedAssignment) formData.append('assignmentId', selectedAssignment)
      if (initialStudentId) formData.append('studentId', initialStudentId)

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
      gotResultRef.current = true
      setResult(data)

      // Update credits from response
      if (data.credits !== undefined && onCreditsUpdate) {
        onCreditsUpdate(data.credits)
      }
    } catch (err) {
      setError(err.message || '提交失败，请稍后再试')
    } finally {
      setSubmitting(false)
      if (!gotResultRef.current) setProgressStep(null)
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

  const selectedAssignmentObj = assignments.find(x => x.id === Number(selectedAssignment))

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-blue-600">🎙️ KET 口语练习</h1>
            <p className="text-xs text-gray-400">自由练习模式</p>
          </div>
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                &larr; 返回
              </button>
            )}
            <a href="/teacher" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              教师登录
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-20">
        {/* Credits display */}
        {initialCredits !== null && initialCredits !== undefined && (
          <div className="flex items-center justify-center">
            <CreditsBadge credits={initialCredits} />
          </div>
        )}

        {!result && (
          <div className="text-center py-2">
            <p className="text-3xl mb-1">👋</p>
            <h2 className="text-xl font-bold text-gray-800">自由练习</h2>
            <p className="text-sm text-gray-500 mt-1">录制你的英语口语，AI 将帮你评分并给出建议</p>
          </div>
        )}

        {!result && (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                        <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2">
                          <span className="text-base">{ptInfo.icon}</span>
                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-indigo-700">{ptInfo.label}</span>
                            <p className="text-xs text-indigo-400 mt-0.5">{ptInfo.desc}</p>
                          </div>
                        </div>
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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <h3 className="font-semibold text-gray-700">🎤 录制或上传音频</h3>
              <div>
                <p className="text-xs text-gray-500 mb-2">方式一：直接录音</p>
                <AudioRecorder onAudioReady={handleRecordingReady} disabled={submitting} />
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

            {submitting && progressStep && (
              <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5">
                <ProgressBar step={progressStep} />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-xl shrink-0">⚠️</span>
                <div>
                  <p className="font-medium">提交失败</p>
                  <p className="text-sm mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {noCredits && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-center">
                <p className="font-semibold">额度已用完</p>
                <p className="text-sm mt-1">请联系老师充值（6 元 = 100 次）</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-lg rounded-2xl shadow-md transition-all active:scale-95 disabled:cursor-not-allowed"
            >
              {submitting ? '评分中…' : '🚀 提交评分'}
            </button>

            {!hasAudio && !noCredits && (
              <p className="text-center text-xs text-gray-400">请先录音或上传音频文件</p>
            )}
          </form>
        )}

        {!result && <StudentHistorySection studentName={studentName} />}

        {result && (
          <div ref={resultRef} className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">评分报告</h2>
              <button onClick={handleReset} className="text-sm text-blue-500 hover:text-blue-700 font-medium">
                再练一次 &rarr;
              </button>
            </div>
            <GradeReport result={result} studentName={studentName} className={className} />
            <StudentHistorySection studentName={studentName} />
          </div>
        )}
      </main>
    </div>
  )
}

// ── Main page (router) ──────────────────────────────────────────────────────

export default function StudentPage() {
  const [selectedClass, setSelectedClass] = useState(undefined) // undefined = not loaded yet
  const [selectedHomework, setSelectedHomework] = useState(null)
  const [mode, setMode] = useState('loading') // loading | classSelect | homeworkList | homework | free
  const [studentName, setStudentName] = useState('')
  const [studentId, setStudentId] = useState(null)
  const [credits, setCredits] = useState(null)
  const [nameConfirmed, setNameConfirmed] = useState(false)

  // Load saved class from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ket_selected_class')
    if (saved) {
      try {
        const cls = JSON.parse(saved)
        setSelectedClass(cls)
        setMode('homeworkList')
      } catch {
        setMode('classSelect')
      }
    } else {
      setMode('classSelect')
    }

    const savedName = localStorage.getItem('ket_student_name')
    const savedStudentId = localStorage.getItem('ket_student_id')
    const savedCredits = localStorage.getItem('ket_credits')
    if (savedName) {
      setStudentName(savedName)
      setNameConfirmed(true)
    }
    if (savedStudentId) setStudentId(Number(savedStudentId))
    if (savedCredits !== null && savedCredits !== '') setCredits(Number(savedCredits))
  }, [])

  function handleClassSelect(cls) {
    if (cls) {
      setSelectedClass(cls)
      localStorage.setItem('ket_selected_class', JSON.stringify(cls))
      // Clear previous student info when switching class
      setNameConfirmed(false)
      setStudentName('')
      setStudentId(null)
      setCredits(null)
      localStorage.removeItem('ket_student_name')
      localStorage.removeItem('ket_student_id')
      localStorage.removeItem('ket_credits')
      setMode('homeworkList')
    } else {
      setSelectedClass(null)
      localStorage.removeItem('ket_selected_class')
      setMode('free')
    }
  }

  function handleChangeClass() {
    localStorage.removeItem('ket_selected_class')
    localStorage.removeItem('ket_student_name')
    localStorage.removeItem('ket_student_id')
    localStorage.removeItem('ket_credits')
    setSelectedClass(null)
    setSelectedHomework(null)
    setNameConfirmed(false)
    setStudentName('')
    setStudentId(null)
    setCredits(null)
    setMode('classSelect')
  }

  function handleSelectHomework(hw) {
    if (!nameConfirmed) {
      // Need name first
      setSelectedHomework(hw)
      return
    }
    setSelectedHomework(hw)
    setMode('homework')
  }

  function handleNameConfirm(name, sid, creds) {
    setStudentName(name)
    setNameConfirmed(true)
    localStorage.setItem('ket_student_name', name)
    if (sid) {
      setStudentId(sid)
      localStorage.setItem('ket_student_id', String(sid))
    }
    if (creds !== null && creds !== undefined) {
      setCredits(creds)
      localStorage.setItem('ket_credits', String(creds))
    }
    setMode('homework')
  }

  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50 flex items-center justify-center">
        <p className="text-gray-400">加载中…</p>
      </div>
    )
  }

  if (mode === 'classSelect') {
    return <ClassSelectScreen onSelect={handleClassSelect} />
  }

  if (mode === 'free') {
    return (
      <FreePracticeScreen
        onBack={() => setMode('classSelect')}
        initialClass={selectedClass?.name || ''}
        studentId={studentId}
        credits={credits}
        onCreditsUpdate={(c) => { setCredits(c); localStorage.setItem('ket_credits', String(c)) }}
      />
    )
  }

  if (mode === 'homework' && selectedHomework && nameConfirmed) {
    return (
      <HomeworkPracticeScreen
        homework={selectedHomework}
        studentName={studentName}
        studentId={studentId}
        credits={credits}
        onCreditsUpdate={(c) => { setCredits(c); localStorage.setItem('ket_credits', String(c)) }}
        onBack={() => { setSelectedHomework(null); setMode('homeworkList') }}
      />
    )
  }

  // homeworkList mode (or need name confirmation)
  if (selectedHomework && !nameConfirmed) {
    // Show name input overlay
    return (
      <NameInputScreen
        onConfirm={handleNameConfirm}
        onBack={() => setSelectedHomework(null)}
        classId={selectedClass?.id}
      />
    )
  }

  return (
    <HomeworkListScreen
      selectedClass={selectedClass}
      onSelectHomework={handleSelectHomework}
      onFreePractice={() => setMode('free')}
      onChangeClass={handleChangeClass}
      credits={credits}
      studentName={nameConfirmed ? studentName : null}
    />
  )
}

// ── Name input screen ───────────────────────────────────────────────────────

function NameInputScreen({ onConfirm, onBack, classId }) {
  const [name, setName] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return

    // If classId provided, verify against roster
    if (classId) {
      setVerifying(true)
      setError(null)
      try {
        const res = await fetch('/api/students/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ class_id: classId, name: name.trim() }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || '姓名不在该班级名单中，请联系老师')
          return
        }
        const data = await res.json()
        onConfirm(name.trim(), data.student_id, data.credits)
      } catch {
        setError('网络错误，请重试')
      } finally {
        setVerifying(false)
      }
    } else {
      onConfirm(name.trim(), null, null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <p className="text-4xl mb-2">👤</p>
          <h2 className="text-xl font-bold text-gray-800">请输入你的姓名</h2>
          <p className="text-sm text-gray-500 mt-1">用于记录你的练习成绩</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(null) }}
            placeholder="请输入姓名"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-base text-center"
            autoFocus
            required
          />
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm text-center">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={!name.trim() || verifying}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-all active:scale-95"
          >
            {verifying ? '验证中…' : '开始练习'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-2 text-gray-400 hover:text-gray-600 text-sm transition"
          >
            返回
          </button>
        </form>
      </div>
    </div>
  )
}
