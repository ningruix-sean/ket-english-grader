import { NextResponse } from 'next/server'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import os from 'os'
import { transcribeAudio, gradeSubmission } from '@/lib/openai'
import { createSubmission, getActiveAssignments, getStudentById, consumeCredit } from '@/lib/db'

export const runtime = 'nodejs'

// Next.js 14 App Router: disable default body parser for multipart
export const dynamic = 'force-dynamic'

export async function POST(request) {
  let tempPath = null

  try {
    const formData = await request.formData()

    const studentName = formData.get('studentName')?.toString().trim()
    const className   = formData.get('className')?.toString().trim()
    const assignmentId = formData.get('assignmentId')?.toString().trim() || null
    const studentId   = formData.get('studentId')?.toString().trim() || null
    const audioFile   = formData.get('audio')

    // Validation
    if (!studentName) {
      return NextResponse.json({ error: '请填写姓名' }, { status: 400 })
    }
    if (!className) {
      return NextResponse.json({ error: '请填写班级' }, { status: 400 })
    }
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

    // Check file size (25MB limit for Whisper)
    const MAX_BYTES = 25 * 1024 * 1024
    if (audioFile.size > MAX_BYTES) {
      return NextResponse.json({ error: '音频文件过大，请保持在 25MB 以内' }, { status: 400 })
    }

    // Write audio to temp file
    const tmpDir = os.tmpdir()
    const ext = getExtension(audioFile.name || audioFile.type || 'webm')
    const tmpFilename = `ket_audio_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    tempPath = path.join(tmpDir, tmpFilename)

    const bytes = await audioFile.arrayBuffer()
    await writeFile(tempPath, Buffer.from(bytes))

    // 1. Transcribe
    let transcript
    try {
      transcript = await transcribeAudio(tempPath)
    } catch (err) {
      console.error('Whisper error:', err)
      return NextResponse.json(
        { error: `语音识别失败：${err.message}` },
        { status: 502 }
      )
    }

    if (!transcript || transcript.trim().length < 3) {
      return NextResponse.json(
        { error: '未能识别到有效语音，请重新录制并确保说了足够内容' },
        { status: 422 }
      )
    }

    // 2. Get reference text and part type if assignment selected
    let referenceText = null
    let partType = null
    if (assignmentId) {
      try {
        const assignments = getActiveAssignments()
        const assignment = assignments.find(a => a.id === Number(assignmentId))
        referenceText = assignment?.reference_text || null
        partType = assignment?.part_type || null
      } catch { /* non-critical */ }
    }

    // 3. Grade with GPT-4o
    let gradeResult
    try {
      gradeResult = await gradeSubmission(transcript, referenceText, partType)
    } catch (err) {
      console.error('GPT-4o grading error:', err)
      return NextResponse.json(
        { error: `AI 评分失败：${err.message}` },
        { status: 502 }
      )
    }

    // 4. Save to DB
    let submissionId
    try {
      submissionId = createSubmission({
        student_name: studentName,
        class_name: className,
        assignment_id: assignmentId ? Number(assignmentId) : null,
        audio_filename: audioFile.name || tmpFilename,
        transcript,
        pronunciation_score: gradeResult.pronunciation_score,
        fluency_score:       gradeResult.fluency_score,
        grammar_score:       gradeResult.grammar_score,
        content_score:       gradeResult.content_score,
        overall_score:       gradeResult.overall_score,
        feedback_en:         gradeResult.feedback_en,
        feedback_cn:         gradeResult.feedback_cn,
        corrections:         gradeResult.corrections,
        practice_suggestions: gradeResult.practice_suggestions,
      })
    } catch (err) {
      console.error('DB save error:', err)
      // Non-fatal: still return result to student
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
    console.error('Grade route error:', err)
    return NextResponse.json(
      { error: '服务器内部错误，请稍后再试' },
      { status: 500 }
    )
  } finally {
    // Cleanup temp file
    if (tempPath) {
      unlink(tempPath).catch(() => {})
    }
  }
}

function getExtension(nameOrType) {
  if (!nameOrType) return 'webm'
  // Try filename extension first
  const dotIdx = nameOrType.lastIndexOf('.')
  if (dotIdx > 0) return nameOrType.slice(dotIdx + 1).toLowerCase()
  // Fall back to mime type
  const mime = nameOrType.toLowerCase()
  if (mime.includes('mp4') || mime.includes('m4a')) return 'm4a'
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('wav')) return 'wav'
  if (mime.includes('mp3') || mime.includes('mpeg')) return 'mp3'
  if (mime.includes('flac')) return 'flac'
  return 'webm'
}
