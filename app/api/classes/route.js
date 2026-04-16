import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getAllClasses, createClass } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function requireTeacher(request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  return verifyToken(token)
}

// GET /api/classes — list all classes (public)
export async function GET() {
  return NextResponse.json(getAllClasses())
}

// POST /api/classes — create a class (teacher only)
export async function POST(request) {
  if (!requireTeacher(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  try {
    const { name } = await request.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: '班级名称不能为空' }, { status: 400 })
    }
    const id = createClass(name.trim())
    return NextResponse.json({ id }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
