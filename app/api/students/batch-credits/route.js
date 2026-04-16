import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { addCreditsToClass } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function requireTeacher(request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  return verifyToken(token)
}

// POST /api/students/batch-credits — add credits to all students in a class (teacher)
// body: { class_id, amount }
export async function POST(request) {
  if (!requireTeacher(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  try {
    const { class_id, amount } = await request.json()
    if (!class_id) return NextResponse.json({ error: '缺少 class_id' }, { status: 400 })
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: '充值次数必须大于 0' }, { status: 400 })
    }

    addCreditsToClass(Number(class_id), Number(amount))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
