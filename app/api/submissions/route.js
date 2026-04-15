import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getSubmissions, getDistinctClasses, getStats } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function requireTeacher(request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  return verifyToken(token)
}

// GET /api/submissions — list submissions (teacher only)
// Query params: class_name, date_from, date_to, min_score, max_score, export=csv
export async function GET(request) {
  if (!requireTeacher(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filters = {
    class_name: searchParams.get('class_name') || undefined,
    date_from:  searchParams.get('date_from')  || undefined,
    date_to:    searchParams.get('date_to')    || undefined,
    min_score:  searchParams.get('min_score')  || undefined,
    max_score:  searchParams.get('max_score')  || undefined,
  }

  const exportMode = searchParams.get('export')

  try {
    const submissions = getSubmissions(filters)

    if (exportMode === 'csv') {
      const csv = buildCSV(submissions)
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="submissions_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    const classes = getDistinctClasses()
    const stats = getStats()
    return NextResponse.json({ submissions, classes, stats })
  } catch (err) {
    console.error('Submissions route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function buildCSV(rows) {
  const headers = [
    'ID', '姓名', '班级', '作业', '总分', '发音', '流利度', '语法', '内容',
    '识别文本', '中文评语', '提交时间',
  ]

  const escape = (v) => {
    if (v == null) return ''
    const s = String(v).replace(/"/g, '""')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
  }

  const lines = [
    '\uFEFF' + headers.join(','), // BOM for Excel UTF-8
    ...rows.map(r => [
      r.id, r.student_name, r.class_name, r.assignment_title || '',
      r.overall_score, r.pronunciation_score, r.fluency_score, r.grammar_score, r.content_score,
      r.transcript || '', r.feedback_cn || '',
      r.submitted_at ? new Date(r.submitted_at).toLocaleString('zh-CN') : '',
    ].map(escape).join(',')),
  ]

  return lines.join('\r\n')
}
