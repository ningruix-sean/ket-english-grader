import { NextResponse } from 'next/server'
import { getQuestion } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/questions/:id — get single question (public)
export async function GET(request, { params }) {
  const { id } = await params
  const question = getQuestion(Number(id))
  if (!question) {
    return NextResponse.json({ error: '题目不存在' }, { status: 404 })
  }
  return NextResponse.json(question)
}
