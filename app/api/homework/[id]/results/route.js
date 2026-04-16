import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getHomework, getHomeworkSubmissions } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function requireTeacher(request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  return verifyToken(token)
}

// GET /api/homework/:id/results — teacher views homework completion (teacher only)
export async function GET(request, { params }) {
  if (!requireTeacher(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { id } = await params
  const homework = getHomework(Number(id))
  if (!homework) {
    return NextResponse.json({ error: '作业不存在' }, { status: 404 })
  }

  const submissions = getHomeworkSubmissions(Number(id))

  // Group by student
  const byStudent = {}
  for (const sub of submissions) {
    if (!byStudent[sub.student_name]) byStudent[sub.student_name] = []
    byStudent[sub.student_name].push(sub)
  }

  let questionIds = []
  try { questionIds = JSON.parse(homework.question_ids) } catch {}

  return NextResponse.json({
    homework,
    total_questions: questionIds.length,
    submissions,
    students: Object.entries(byStudent).map(([name, subs]) => ({
      name,
      completed: subs.length,
      avg_score: subs.length > 0
        ? Math.round(subs.reduce((sum, s) => sum + (s.score || 0), 0) / subs.length)
        : 0,
      submissions: subs,
    })),
  })
}
