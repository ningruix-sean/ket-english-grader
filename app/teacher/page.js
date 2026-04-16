'use client'

import { useState, useEffect, useCallback } from 'react'
import SubmissionTable from '@/components/SubmissionTable'
import ProgressChart from '@/components/ProgressChart'

// ── Login screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        onLogin(data.token)
      } else {
        setError('密码错误，请重试')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <p className="text-4xl mb-2">🏫</p>
          <h1 className="text-2xl font-bold text-gray-800">教师管理后台</h1>
          <p className="text-sm text-gray-500 mt-1">KET 英语口语评分系统</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">管理员密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-base"
              autoFocus
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-all active:scale-95"
          >
            {loading ? '验证中…' : '登录'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400">
          默认密码：teacher123（可通过 TEACHER_PASSWORD 环境变量修改）
        </p>
      </div>
    </div>
  )
}

// ── Part type config ──────────────────────────────────────────────────────────

const PART_TYPE_OPTIONS = [
  { value: 'free',  label: '自由练习',       desc: '综合口语，不限题型' },
  { value: 'part1', label: 'Part 1 — 问答对话', desc: '日常问答，侧重流利度' },
  { value: 'part2', label: 'Part 2 — 情景对话', desc: '信息交换，侧重交际能力' },
  { value: 'part3', label: 'Part 3 — 看图描述', desc: '图片描述，侧重词汇描述' },
]

const PART_TYPE_BADGE = {
  part1: { label: 'Part 1',    color: 'bg-blue-50 text-blue-600' },
  part2: { label: 'Part 2',    color: 'bg-purple-50 text-purple-600' },
  part3: { label: 'Part 3',    color: 'bg-amber-50 text-amber-600' },
  free:  { label: '自由练习',  color: 'bg-gray-100 text-gray-500' },
}

const CATEGORY_LABELS = {
  greeting: { label: '打招呼和介绍', icon: '👋' },
  daily_life: { label: '日常生活与能力', icon: '🏠' },
  others: { label: '其他', icon: '💬' },
}

// ── Assignment modal (existing) ──────────────────────────────────────────────

function AssignmentModal({ token, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '', description: '', reference_text: '', class_name: '', part_type: 'free',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('保存失败')
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl">
          <h2 className="text-lg font-bold text-gray-800">新建作业</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">✕</button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">作业标题 <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="例如：自我介绍练习"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
              required
            />
          </div>

          {/* Part type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">题目类型</label>
            <div className="grid grid-cols-2 gap-2">
              {PART_TYPE_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    form.part_type === opt.value
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="part_type"
                    value={opt.value}
                    checked={form.part_type === opt.value}
                    onChange={() => setForm(f => ({ ...f, part_type: opt.value }))}
                    className="mt-0.5 accent-blue-500"
                  />
                  <div>
                    <p className={`text-xs font-semibold ${form.part_type === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">题目说明</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="作业说明（给学生看）"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              参考文本
              <span className="text-gray-400 font-normal ml-1">（AI 评分时会参考此内容）</span>
            </label>
            <textarea
              value={form.reference_text}
              onChange={e => setForm(f => ({ ...f, reference_text: e.target.value }))}
              placeholder="例如朗读材料或问题答案参考…"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">指定班级（留空=全部）</label>
            <input
              type="text"
              value={form.class_name}
              onChange={e => setForm(f => ({ ...f, class_name: e.target.value }))}
              placeholder="例如：五年级3班"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition">取消</button>
            <button type="submit" disabled={saving || !form.title.trim()} className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-semibold transition">
              {saving ? '保存中…' : '保存作业'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Homework modal (V3 — select from question bank) ─────────────────────────

function HomeworkModal({ token, classes, onClose, onSaved }) {
  const [form, setForm] = useState({ class_id: '', title: '', due_date: '' })
  const [questions, setQuestions] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [filterCat, setFilterCat] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/questions')
      .then(r => r.ok ? r.json() : [])
      .then(data => setQuestions(Array.isArray(data) ? data : []))
      .catch(() => setQuestions([]))
  }, [])

  function toggleQuestion(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll(ids) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.add(id))
      return next
    })
  }

  function deselectAll(ids) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.delete(id))
      return next
    })
  }

  const filtered = filterCat ? questions.filter(q => q.category === filterCat) : questions

  // Group by category and subcategory
  const grouped = {}
  for (const q of filtered) {
    const cat = q.category
    const sub = q.subcategory || '其他'
    if (!grouped[cat]) grouped[cat] = {}
    if (!grouped[cat][sub]) grouped[cat][sub] = []
    grouped[cat][sub].push(q)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.class_id || !form.title.trim() || selectedIds.size === 0) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          class_id: Number(form.class_id),
          title: form.title.trim(),
          question_ids: Array.from(selectedIds),
          due_date: form.due_date || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || '保存失败')
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
          <h2 className="text-lg font-bold text-gray-800">布置作业（从题库选题）</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">✕</button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">作业标题 <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="例如：第一周口语练习"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">选择班级 <span className="text-red-400">*</span></label>
              <select
                value={form.class_id}
                onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm bg-white"
                required
              >
                <option value="">— 请选择 —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">截止日期（可选）</label>
            <input
              type="date"
              value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
            />
          </div>

          {/* Question bank selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-600">
                选择题目 <span className="text-red-400">*</span>
                <span className="text-gray-400 font-normal ml-2">已选 {selectedIds.size} 题</span>
              </label>
              <div className="flex gap-1">
                {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilterCat(filterCat === key ? '' : key)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      filterCat === key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl max-h-64 overflow-y-auto">
              {Object.entries(grouped).map(([cat, subs]) => (
                <div key={cat}>
                  {Object.entries(subs).map(([subcat, qs]) => {
                    const subIds = qs.map(q => q.id)
                    const allSelected = subIds.every(id => selectedIds.has(id))
                    return (
                      <div key={`${cat}-${subcat}`}>
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100 sticky top-0">
                          <span className="text-xs font-semibold text-gray-500">
                            {CATEGORY_LABELS[cat]?.icon} {CATEGORY_LABELS[cat]?.label} / {subcat}
                            <span className="text-gray-400 font-normal ml-1">({qs.length})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => allSelected ? deselectAll(subIds) : selectAll(subIds)}
                            className="text-xs text-blue-500 hover:text-blue-700"
                          >
                            {allSelected ? '取消全选' : '全选'}
                          </button>
                        </div>
                        {qs.map(q => (
                          <label
                            key={q.id}
                            className={`flex items-start gap-2.5 px-3 py-2 border-b border-gray-50 cursor-pointer hover:bg-blue-50/50 transition ${
                              selectedIds.has(q.id) ? 'bg-blue-50/30' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.has(q.id)}
                              onChange={() => toggleQuestion(q.id)}
                              className="mt-0.5 accent-blue-500"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-700">{q.examiner_question}</p>
                              <p className="text-xs text-gray-400 mt-0.5 truncate">ref: {q.reference_answer}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition">取消</button>
            <button
              type="submit"
              disabled={saving || !form.title.trim() || !form.class_id || selectedIds.size === 0}
              className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-semibold transition"
            >
              {saving ? '保存中…' : `布置作业（${selectedIds.size} 题）`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Homework results modal ───────────────────────────────────────────────────

function HomeworkResultsModal({ token, homework, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/homework/${homework.id}/results`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [homework.id, token])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-800">作业完成情况</h2>
            <p className="text-sm text-gray-400">{homework.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">✕</button>
        </div>
        <div className="p-5">
          {loading && <p className="text-sm text-gray-400 text-center py-8">加载中…</p>}
          {!loading && !data && <p className="text-sm text-red-400 text-center py-8">加载失败</p>}
          {!loading && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{data.students?.length || 0}</p>
                  <p className="text-xs text-blue-400">提交学生</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{data.total_questions}</p>
                  <p className="text-xs text-green-400">总题数</p>
                </div>
              </div>

              {(!data.students || data.students.length === 0) ? (
                <p className="text-sm text-gray-400 text-center py-6">暂无提交</p>
              ) : (
                <div className="space-y-3">
                  {data.students.map(student => (
                    <div key={student.name} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-700">{student.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            完成 {student.completed}/{data.total_questions}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            student.avg_score >= 90 ? 'bg-emerald-100 text-emerald-700' :
                            student.avg_score >= 75 ? 'bg-blue-100 text-blue-700' :
                            student.avg_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-600'
                          }`}>
                            均分 {student.avg_score}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {student.submissions.map(sub => (
                          <div key={sub.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                            <span className="text-gray-500 truncate flex-1 mr-2">{sub.examiner_question}</span>
                            <span className={`font-bold ${
                              sub.score >= 90 ? 'text-emerald-600' :
                              sub.score >= 75 ? 'text-blue-600' :
                              sub.score >= 60 ? 'text-yellow-600' :
                              'text-red-500'
                            }`}>{sub.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Student progress panel (teacher side) ─────────────────────────────────────

function StudentProgressPanel() {
  const [searchName, setSearchName] = useState('')
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleSearch(e) {
    e.preventDefault()
    if (!searchName.trim()) return
    setLoading(true)
    setHistory(null)
    fetch(`/api/student-history?name=${encodeURIComponent(searchName.trim())}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
        <span>📈</span> 学生进步追踪
      </h3>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
          placeholder="输入学生姓名…"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-400 outline-none"
        />
        <button
          type="submit"
          disabled={loading || !searchName.trim()}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 text-white text-sm font-medium rounded-lg transition"
        >
          {loading ? '查询中…' : '查询'}
        </button>
      </form>

      {loading && <p className="text-sm text-gray-400 text-center py-4">加载中…</p>}

      {history !== null && !loading && (
        <>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">未找到&ldquo;{searchName}&rdquo;的提交记录</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                {searchName} · 共 {history.length} 次提交
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="text-left py-1.5 font-medium">日期</th>
                      <th className="text-left py-1.5 font-medium">作业</th>
                      <th className="text-center py-1.5 font-medium">发音</th>
                      <th className="text-center py-1.5 font-medium">流利</th>
                      <th className="text-center py-1.5 font-medium">语法</th>
                      <th className="text-center py-1.5 font-medium">内容</th>
                      <th className="text-center py-1.5 font-medium">总分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(h => {
                      const sc = h.overall_score
                      const badge = sc >= 90 ? 'text-emerald-600 font-bold' :
                                    sc >= 75 ? 'text-blue-600 font-bold' :
                                    sc >= 60 ? 'text-yellow-600 font-bold' :
                                               'text-red-500 font-bold'
                      return (
                        <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-1.5 text-gray-500">
                            {new Date(h.submitted_at).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                          </td>
                          <td className="py-1.5 text-blue-500 truncate max-w-[100px]">
                            {h.assignment_title || '—'}
                          </td>
                          <td className="py-1.5 text-center text-gray-600">{h.pronunciation_score}</td>
                          <td className="py-1.5 text-center text-gray-600">{h.fluency_score}</td>
                          <td className="py-1.5 text-center text-gray-600">{h.grammar_score}</td>
                          <td className="py-1.5 text-center text-gray-600">{h.content_score}</td>
                          <td className={`py-1.5 text-center ${badge}`}>{sc}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <ProgressChart history={history} height={200} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Class management panel ───────────────────────────────────────────────────

function ClassManagementPanel({ token, classes, onRefresh }) {
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    try {
      await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newName.trim() }),
      })
      setNewName('')
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`确认删除班级"${name}"？关联的作业也会受影响。`)) return
    await fetch(`/api/classes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">创建新班级</h3>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="例如：周六KET一班"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
          />
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition"
          >
            {saving ? '创建中…' : '创建'}
          </button>
        </form>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">🏫</p>
          <p>还没有班级，请先创建</p>
        </div>
      ) : (
        <div className="space-y-2">
          {classes.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-800">{c.name}</h4>
                <p className="text-xs text-gray-400">
                  创建于 {new Date(c.created_at).toLocaleDateString('zh-CN')}
                </p>
              </div>
              <button
                onClick={() => handleDelete(c.id, c.name)}
                className="text-gray-300 hover:text-red-400 transition text-sm"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Homework management panel ────────────────────────────────────────────────

function HomeworkPanel({ token, classes, homeworkList, onRefresh, onShowResults }) {
  return (
    <div className="space-y-4">
      {homeworkList.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">📚</p>
          <p>还没有作业，点击&ldquo;布置作业&rdquo;开始吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {homeworkList.map(hw => {
            let qCount = 0
            try { qCount = JSON.parse(hw.question_ids).length } catch {}
            return (
              <div key={hw.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800">{hw.title}</h3>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {hw.class_name}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {qCount} 题
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-400">
                        {new Date(hw.created_at).toLocaleDateString('zh-CN')}
                      </p>
                      {hw.due_date && (
                        <p className="text-xs text-orange-400">
                          截止: {hw.due_date}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onShowResults(hw)}
                    className="shrink-0 text-sm text-blue-500 hover:text-blue-700 font-medium"
                  >
                    查看完成情况
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function TeacherPage() {
  const [token, setToken] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [classes, setClasses] = useState([])
  const [managedClasses, setManagedClasses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [homeworkList, setHomeworkList] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('submissions')
  const [showModal, setShowModal] = useState(false)
  const [showHomeworkModal, setShowHomeworkModal] = useState(false)
  const [resultsHomework, setResultsHomework] = useState(null)
  const [filters, setFilters] = useState({ class_name: '', date_from: '', date_to: '', min_score: '', max_score: '' })
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem('teacher_token')
    if (saved) setToken(saved)
  }, [])

  function handleLogin(tok) {
    sessionStorage.setItem('teacher_token', tok)
    setToken(tok)
  }

  function handleLogout() {
    sessionStorage.removeItem('teacher_token')
    setToken(null)
  }

  const authHeader = { 'Authorization': `Bearer ${token}` }

  const fetchSubmissions = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      const res = await fetch(`/api/submissions?${params}`, { headers: authHeader })
      if (res.status === 401) { handleLogout(); return }
      const data = await res.json()
      setSubmissions(Array.isArray(data.submissions) ? data.submissions : [])
      setClasses(Array.isArray(data.classes) ? data.classes : [])
      setStats(data.stats || null)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [token, filters])

  const fetchAssignments = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/assignments?all=1', { headers: authHeader })
      if (!res.ok) return
      const data = await res.json()
      setAssignments(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
  }, [token])

  const fetchManagedClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes')
      if (!res.ok) return
      const data = await res.json()
      setManagedClasses(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
  }, [])

  const fetchHomework = useCallback(async () => {
    // Fetch homework for all managed classes
    if (managedClasses.length === 0) { setHomeworkList([]); return }
    try {
      const all = await Promise.all(
        managedClasses.map(c =>
          fetch(`/api/homework?class_id=${c.id}`).then(r => r.ok ? r.json() : [])
        )
      )
      const merged = all.flat()
      merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setHomeworkList(merged)
    } catch {
      setHomeworkList([])
    }
  }, [managedClasses])

  useEffect(() => {
    if (token) {
      fetchSubmissions()
      fetchAssignments()
      fetchManagedClasses()
    }
  }, [token, fetchSubmissions, fetchAssignments, fetchManagedClasses])

  useEffect(() => {
    if (token && managedClasses.length > 0) {
      fetchHomework()
    }
  }, [token, managedClasses, fetchHomework])

  async function handleDeleteAssignment(id) {
    if (!confirm('确认删除此作业？')) return
    await fetch(`/api/assignments?id=${id}`, { method: 'DELETE', headers: authHeader })
    fetchAssignments()
  }

  async function handleExportCSV() {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      params.set('export', 'csv')
      const res = await fetch(`/api/submissions?${params}`, { headers: authHeader })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `submissions_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  if (!token) return <LoginScreen onLogin={handleLogin} />

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">🏫 教师管理后台</h1>
            <p className="text-xs text-gray-400">KET 英语口语评分系统</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-blue-500 hover:text-blue-700">&larr; 学生页面</a>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '提交总数', value: stats.total_submissions, icon: '📋' },
              { label: '学生人数', value: stats.total_students, icon: '👤' },
              { label: '班级数量', value: managedClasses.length, icon: '🏫' },
              { label: '平均分', value: stats.avg_score ? `${stats.avg_score}分` : '—', icon: '📊' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-800">{s.value ?? '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
          {[
            { key: 'submissions',  label: '📋 提交记录' },
            { key: 'assignments',  label: '📝 自由作业' },
            { key: 'classes',      label: '🏫 班级管理' },
            { key: 'homework',     label: '📚 题库作业' },
            { key: 'progress',     label: '📈 进步追踪' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Submissions tab ───────────────────────────────────────── */}
        {tab === 'submissions' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">班级</label>
                  <select
                    value={filters.class_name}
                    onChange={e => setFilters(f => ({ ...f, class_name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-400 outline-none bg-white"
                  >
                    <option value="">全部班级</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">开始日期</label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">结束日期</label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">最低分</label>
                  <input
                    type="number" min="0" max="100"
                    value={filters.min_score}
                    onChange={e => setFilters(f => ({ ...f, min_score: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">最高分</label>
                  <input
                    type="number" min="0" max="100"
                    value={filters.max_score}
                    onChange={e => setFilters(f => ({ ...f, max_score: e.target.value }))}
                    placeholder="100"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-400 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={fetchSubmissions}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 text-white text-sm font-medium rounded-lg transition"
                >
                  {loading ? '加载中…' : '🔍 筛选'}
                </button>
                <button
                  onClick={() => setFilters({ class_name: '', date_from: '', date_to: '', min_score: '', max_score: '' })}
                  className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
                >
                  重置
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={exporting || submissions.length === 0}
                  className="ml-auto px-4 py-2 border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 text-sm font-medium rounded-lg transition flex items-center gap-2"
                >
                  {exporting ? '导出中…' : '⬇️ 导出 CSV'}
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-3">共 {submissions.length} 条记录</p>
              <SubmissionTable submissions={submissions} onRefresh={fetchSubmissions} />
            </div>
          </div>
        )}

        {/* ── Assignments tab ───────────────────────────────────────── */}
        {tab === 'assignments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">共 {assignments.length} 个作业</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition active:scale-95 flex items-center gap-2"
              >
                <span>＋</span> 新建作业
              </button>
            </div>

            {assignments.length === 0 ? (
              <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
                <p className="text-4xl mb-3">📝</p>
                <p>还没有作业，点击&ldquo;新建作业&rdquo;开始吧</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map(a => {
                  const ptBadge = PART_TYPE_BADGE[a.part_type] || PART_TYPE_BADGE.free
                  return (
                    <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-800">{a.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ptBadge.color}`}>
                              {ptBadge.label}
                            </span>
                            {a.class_name && (
                              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{a.class_name}</span>
                            )}
                            {!a.active && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">已停用</span>
                            )}
                          </div>
                          {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                          {a.reference_text && (
                            <p className="text-xs text-gray-400 mt-1 truncate">📖 {a.reference_text}</p>
                          )}
                          <p className="text-xs text-gray-300 mt-2">
                            {new Date(a.created_at).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteAssignment(a.id)}
                          className="shrink-0 text-gray-300 hover:text-red-400 transition text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Classes tab (V3) ──────────────────────────────────────── */}
        {tab === 'classes' && (
          <ClassManagementPanel
            token={token}
            classes={managedClasses}
            onRefresh={fetchManagedClasses}
          />
        )}

        {/* ── Homework tab (V3) ─────────────────────────────────────── */}
        {tab === 'homework' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">共 {homeworkList.length} 个题库作业</p>
              <button
                onClick={() => setShowHomeworkModal(true)}
                disabled={managedClasses.length === 0}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition active:scale-95 flex items-center gap-2"
              >
                <span>＋</span> 布置作业
              </button>
            </div>
            {managedClasses.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-2xl p-4 text-sm">
                请先在&ldquo;班级管理&rdquo;中创建班级，才能布置题库作业。
              </div>
            )}
            <HomeworkPanel
              token={token}
              classes={managedClasses}
              homeworkList={homeworkList}
              onRefresh={fetchHomework}
              onShowResults={hw => setResultsHomework(hw)}
            />
          </div>
        )}

        {/* ── Progress tab ──────────────────────────────────────────── */}
        {tab === 'progress' && (
          <StudentProgressPanel />
        )}
      </main>

      {/* Assignment modal */}
      {showModal && (
        <AssignmentModal
          token={token}
          onClose={() => setShowModal(false)}
          onSaved={fetchAssignments}
        />
      )}

      {/* Homework modal */}
      {showHomeworkModal && (
        <HomeworkModal
          token={token}
          classes={managedClasses}
          onClose={() => setShowHomeworkModal(false)}
          onSaved={fetchHomework}
        />
      )}

      {/* Homework results modal */}
      {resultsHomework && (
        <HomeworkResultsModal
          token={token}
          homework={resultsHomework}
          onClose={() => setResultsHomework(null)}
        />
      )}
    </div>
  )
}
