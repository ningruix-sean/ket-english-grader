import { NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import os from 'os'
import { transcribeAudio, gradeSubmission } from '@/lib/openai'
import { getHomework, getQuestion, createHomeworkSubmission, getStudentById, consumeCredit } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/homework/:id/submit — student submits a recording for a question
export async function POST(request, { params }) {
  let tempPath = null
  try {
    const { id: homeworkId } = await params
    const formData = await request.formData()

    const studentName = formData.get('studentName')?.toString().trim()
    const questionId = formData.get('questionId')?.toString().trim()
    const studentId = formData.get('studentId')?.toString().trim() || null
    const audioFile = formData.get('audio')

    if (!studentName) return NextResponse.json({ error: '请填写姓名' }, { status: 400 })
    if (!questionId) return NextResponse.json({ error: '缺少题目ID' }, { status: 400 })
    if (!audioFile || typeof audioFile === 'string') {
      return NextResponse.json({ error: '请上传音频文件' }, { status: 400 })
    }

    // Check credits if student_id provided
    if (studentId) {
      const student = getStudentById(Number(studentId))
      if (student && student.credits <= 0) {
        return NextResponse.json({ error: '额度已用完，请联系老师充值' }, { status: 403 })
      }
    }

    const MAX_BYTES = 25 * 1024 * 1024
    if (audioFile.size > MAX_BYTES) {
      return NextResponse.json({ error: '音频文件过大，请保持在 25MB 以内' }, { status: 400 })
    }

    // Verify homework and question exist
    const homework = getHomework(Number(homeworkId))
    if (!homework) return NextResponse.json({ error: '作业不存在' }, { status: 404 })

    const question = getQuestion(Number(questionId))
    if (!question) return NextResponse.json({ error: '题目不存在' }, { status: 404 })

    // Write audio to temp file
    const ext = getExtension(audioFile.name || audioFile.type || 'webm')
    const tmpFilename = `ket_hw_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    tempPath = path.join(os.tmpdir(), tmpFilename)

    const bytes = await audioFile.arrayBuffer()
    await writeFile(tempPath, Buffer.from(bytes))

    // 1. Transcribe
    let transcript
    try {
      transcript = await transcribeAudio(tempPath)
    } catch (err) {
      console.error('Whisper error:', err)
      return NextResponse.json({ error: `语音识别失败：${err.message}` }, { status: 502 })
    }

    if (!transcript || transcript.trim().length < 3) {
      return NextResponse.json(
        { error: '未能识别到有效语音，请重新录制并确保说了足够内容' },
        { status: 422 }
      )
    }

    // 2. Grade with GPT-4o, passing reference answer as context
    const referenceText = `Examiner question: "${question.examiner_question}"\nReference answer: "${question.reference_answer}"`
    let gradeResult
    try {
      gradeResult = await gradeSubmission(transcript, referenceText, 'part1')
    } catch (err) {
      console.error('GPT-4o grading error:', err)
      return NextResponse.json({ error: `AI 评分失败：${err.message}` }, { status: 502 })
    }

    // 3. Save to homework_submissions
    const feedbackJson = JSON.stringify({
      ...gradeResult,
      transcript,
    })

    let submissionId
    try {
      submissionId = createHomeworkSubmission({
        homework_id: Number(homeworkId),
        question_id: Number(questionId),
        student_name: studentName,
        transcript,
        score: gradeResult.overall_score,
        feedback: feedbackJson,
        audio_path: tmpFilename,
      })
    } catch (err) {
      console.error('DB save error:', err)
    }

    // Consume 1 credit after successful grading
    let remainingCredits = null
    if (studentId) {
      try {
        const updated = consumeCredit(Number(studentId))
        if (updated) remainingCredits = updated.credits
      } catch (err) {
        console.error('Credit deduction error:', err)
      }
    }

    return NextResponse.json({
      id: submissionId,
      transcript,
      ...gradeResult,
      ...(remainingCredits !== null ? { credits: remainingCredits } : {}),
    })
  } catch (err) {
    console.error('Homework submit error:', err)
    return NextResponse.json({ error: '服务器内部错误，请稍后再试' }, { status: 500 })
  } finally {
    if (tempPath) unlink(tempPath).catch(() => {})
  }
}

function getExtension(nameOrType) {
  if (!nameOrType) return 'webm'
  const dotIdx = nameOrType.lastIndexOf('.')
  if (dotIdx > 0) return nameOrType.slice(dotIdx + 1).toLowerCase()
  const mime = nameOrType.toLowerCase()
  if (mime.includes('mp4') || mime.includes('m4a')) return 'm4a'
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('wav')) return 'wav'
  if (mime.includes('mp3') || mime.includes('mpeg')) return 'mp3'
  if (mime.includes('flac')) return 'flac'
  return 'webm'
}
