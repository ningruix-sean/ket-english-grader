import { NextResponse } from 'next/server'
import { verifyStudent } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/students/verify — student verifies name against class roster (public)
// body: { class_id, name }
export async function POST(request) {
  try {
    const { class_id, name } = await request.json()
    if (!class_id || !name?.trim()) {
      return NextResponse.json({ error: '缺少班级或姓名' }, { status: 400 })
    }

    const student = verifyStudent(Number(class_id), name.trim())
    if (!student) {
      return NextResponse.json(
        { error: '姓名不在该班级名单中，请联系老师' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      student_id: student.id,
      name: student.name,
      credits: student.credits,
      total_used: student.total_used,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
