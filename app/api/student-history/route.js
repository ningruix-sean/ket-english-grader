import { NextResponse } from 'next/server'
import { getStudentHistory } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/student-history?name=xxx
// Requires x-student-token header = Base64(student_name) as simple auth
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')?.trim()
  if (!name) {
    return NextResponse.json([], { status: 200 })
  }

  const token = request.headers.get('x-student-token')
  const expectedToken = Buffer.from(name).toString('base64')
  if (!token || token !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const history = getStudentHistory(name)
    return NextResponse.json(history)
  } catch (err) {
    console.error('Student history error:', err)
    return NextResponse.json([], { status: 200 })
  }
}
