import { NextResponse } from 'next/server'
import { signToken } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const { password } = body

    const correctPassword = process.env.TEACHER_PASSWORD || 'teacher123'

    if (!password || password !== correctPassword) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 })
    }

    const token = signToken({ role: 'teacher', iat: Date.now() })
    return NextResponse.json({ ok: true, token })
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }
}
