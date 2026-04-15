import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import {
  getActiveAssignments,
  getAllAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function requireTeacher(request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  return verifyToken(token)
}

// GET /api/assignments?class=xxx        — active assignments for a class (student use, no auth)
// GET /api/assignments?all=1            — all assignments (teacher, requires auth)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const className = searchParams.get('class')
  const all = searchParams.get('all')

  if (all) {
    // Teacher view — require auth
    if (!requireTeacher(request)) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }
    return NextResponse.json(getAllAssignments())
  }

  // Public: active assignments for student
  return NextResponse.json(getActiveAssignments(className))
}

// POST /api/assignments — create assignment (teacher only)
export async function POST(request) {
  if (!requireTeacher(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { title, description, reference_text, class_name, part_type } = body
    if (!title?.trim()) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
    }
    const id = createAssignment({ title: title.trim(), description, reference_text, class_name, part_type })
    return NextResponse.json({ id }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT /api/assignments — update assignment (teacher only)
export async function PUT(request) {
  if (!requireTeacher(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { id, ...fields } = body
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })
    updateAssignment(id, fields)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/assignments?id=xxx — soft-delete (teacher only)
export async function DELETE(request) {
  if (!requireTeacher(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })
  deleteAssignment(Number(id))
  return NextResponse.json({ ok: true })
}
