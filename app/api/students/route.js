import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getStudentsByClass, createStudents, deleteStudent } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function requireTeacher(request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  return verifyToken(token)
}

// GET /api/students?class_id= — list students in a class (teacher)
export async function GET(request) {
  if (!requireTeacher(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const classId = searchParams.get('class_id')
  if (!classId) {
    return NextResponse.json({ error: '缺少 class_id 参数' }, { status: 400 })
  }
  return NextResponse.json(getStudentsByClass(Number(classId)))
}

// POST /api/students — batch add students (teacher)
// body: { class_id, names: "name1,name2\nname3" } or { class_id, names: ["a","b"] }
export async function POST(request) {
  if (!requireTeacher(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  try {
    const { class_id, names } = await request.json()
    if (!class_id) {
      return NextResponse.json({ error: '缺少 class_id' }, { status: 400 })
    }

    let nameList
    if (Array.isArray(names)) {
      nameList = names.map(n => n.trim()).filter(Boolean)
    } else if (typeof names === 'string') {
      nameList = names.split(/[,\n，]/).map(n => n.trim()).filter(Boolean)
    } else {
      return NextResponse.json({ error: '请提供学生姓名' }, { status: 400 })
    }

    if (nameList.length === 0) {
      return NextResponse.json({ error: '请提供至少一个学生姓名' }, { status: 400 })
    }

    const ids = createStudents(Number(class_id), nameList)
    return NextResponse.json({ count: ids.length, ids }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/students?id= — delete a student (teacher)
export async function DELETE(request) {
  if (!requireTeacher(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: '缺少 id 参数' }, { status: 400 })
  }
  deleteStudent(Number(id))
  return NextResponse.json({ ok: true })
}
