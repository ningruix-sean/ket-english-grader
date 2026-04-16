import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { addCredits, getStudentById } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function requireTeacher(request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  return verifyToken(token)
}

// POST /api/students/:id/credits — add credits to a student (teacher)
// body: { amount: 100 }
export async function POST(request, { params }) {
  if (!requireTeacher(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  try {
    const { id } = await params
    const { amount } = await request.json()

    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: '充值次数必须大于 0' }, { status: 400 })
    }

    const existing = getStudentById(Number(id))
    if (!existing) {
      return NextResponse.json({ error: '学生不存在' }, { status: 404 })
    }

    const updated = addCredits(Number(id), Number(amount))
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
