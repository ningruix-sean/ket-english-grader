import { NextResponse } from 'next/server'
import { getHomework, getQuestions } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/homework/:id — get homework details with questions (public)
export async function GET(request, { params }) {
  const { id } = await params
  const homework = getHomework(Number(id))
  if (!homework) {
    return NextResponse.json({ error: '作业不存在' }, { status: 404 })
  }

  // Parse question_ids and fetch full question data
  let questionIds = []
  try {
    questionIds = JSON.parse(homework.question_ids)
  } catch { /* ignore */ }

  const allQuestions = getQuestions()
  const questions = questionIds
    .map(qid => allQuestions.find(q => q.id === qid))
    .filter(Boolean)

  return NextResponse.json({
    ...homework,
    questions,
  })
}
