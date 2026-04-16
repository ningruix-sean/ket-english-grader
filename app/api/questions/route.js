import { NextResponse } from 'next/server'
import { getQuestions } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/questions?category=greeting — list questions (public)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  return NextResponse.json(getQuestions(category || null))
}
