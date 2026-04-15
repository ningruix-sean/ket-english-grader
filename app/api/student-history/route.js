import { NextResponse } from 'next/server'
import { getStudentHistory } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/student-history?name=xxx — public endpoint, no auth required
// Returns all submissions for a student, ordered by date ASC (for charting)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')?.trim()
  if (!name) {
    return NextResponse.json([], { status: 200 })
  }
  try {
    const history = getStudentHistory(name)
    return NextResponse.json(history)
  } catch (err) {
    console.error('Student history error:', err)
    return NextResponse.json([], { status: 200 })
  }
}
