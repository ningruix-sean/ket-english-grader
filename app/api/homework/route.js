import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getHomeworkByClass, createHomework } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function requireTeacher(request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  return verifyToken(token)
}

// GET /api/homework?class_id=1 — list homework for a class (public)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const classId = searchParams.get('class_id')
  if (!classId) {
    return NextResponse.json({ error: '缺少 class_id 参数' }, { status: 400 })
  }
  return NextResponse.json(getHomeworkByClass(Number(classId)))
}

// POST /api/homework — create homework (teacher only)
export async function POST(request) {
  if (!requireTeacher(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { class_id, title, question_ids, due_date } = body
    if (!class_id) return NextResponse.json({ error: '请选择班级' }, { status: 400 })
    if (!title?.trim()) return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
    if (!Array.isArray(question_ids) || question_ids.length === 0) {
      return NextResponse.json({ error: '请至少选择一道题目' }, { status: 400 })
    }
    const id = createHomework({ class_id, title: title.trim(), question_ids, due_date })
    return NextResponse.json({ id }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
