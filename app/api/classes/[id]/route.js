import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { deleteClass } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function requireTeacher(request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  return verifyToken(token)
}

// DELETE /api/classes/:id — delete a class (teacher only)
export async function DELETE(request, { params }) {
  if (!requireTeacher(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  const { id } = await params
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })
  deleteClass(Number(id))
  return NextResponse.json({ ok: true })
}
