'use client'

import { useState, useEffect, useCallback } from 'react'
import SubmissionTable from '@/components/SubmissionTable'

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
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
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

// ── Assignment modal ──────────────────────────────────────────────────────────

function AssignmentModal({ token, onClose, onSaved }) {
  const [form, setForm] = useState({ title: '', description: '', reference_text: '', class_name: '' })
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
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
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

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function TeacherPage() {
  const [token, setToken] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [classes, setClasses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('submissions') // submissions | assignments
  const [showModal, setShowModal] = useState(false)
  const [filters, setFilters] = useState({ class_name: '', date_from: '', date_to: '', min_score: '', max_score: '' })
  const [exporting, setExporting] = useState(false)

  // Restore session token
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

  useEffect(() => {
    if (token) {
      fetchSubmissions()
      fetchAssignments()
    }
  }, [token, fetchSubmissions, fetchAssignments])

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
            <a href="/" className="text-sm text-blue-500 hover:text-blue-700">← 学生页面</a>
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
              { label: '班级数量', value: stats.total_classes, icon: '🏫' },
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
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { key: 'submissions', label: '📋 提交记录' },
            { key: 'assignments', label: '📝 作业管理' },
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

        {/* Submissions tab */}
        {tab === 'submissions' && (
          <div className="space-y-4">
            {/* Filters */}
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

            {/* Table */}
            <div>
              <p className="text-sm text-gray-500 mb-3">
                共 {submissions.length} 条记录
              </p>
              <SubmissionTable submissions={submissions} onRefresh={fetchSubmissions} />
            </div>
          </div>
        )}

        {/* Assignments tab */}
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
                <p>还没有作业，点击"新建作业"开始吧</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map(a => (
                  <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800">{a.title}</h3>
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
                ))}
              </div>
            )}
          </div>
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
    </div>
  )
}
