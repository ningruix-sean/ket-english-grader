import OpenAI from 'openai'
import fs from 'fs'

let client = null

function getClient() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return client
}

/**
 * Transcribe an audio file using Whisper.
 * @param {string} filePath - Path to the audio file on disk
 * @returns {Promise<string>} - Transcribed text
 */
export async function transcribeAudio(filePath) {
  const openai = getClient()

  const fileStream = fs.createReadStream(filePath)
  const response = await openai.audio.transcriptions.create({
    file: fileStream,
    model: 'whisper-1',
    language: 'en',
    response_format: 'text',
  })

  return response.trim()
}

// Part-type specific grading guidance
const PART_TYPE_GUIDANCE = {
  part1: `
This is a KET Part 1 (Interview / Daily Questions) task.
Place extra weight on: fluency and naturalness of conversational responses, pronunciation clarity, and ability to answer personal/everyday questions spontaneously.`,
  part2: `
This is a KET Part 2 (Simulated Discussion / Information Exchange) task.
Place extra weight on: ability to communicate specific information clearly, interaction effectiveness, and completeness and accuracy of the information exchanged.`,
  part3: `
This is a KET Part 3 (General Conversation / Picture Description) task.
Place extra weight on: descriptive vocabulary range and variety, ability to speculate and discuss ideas, and development of extended discourse.`,
}

/**
 * Grade a KET English oral submission using GPT-4o.
 * Returns structured scores and bilingual feedback.
 *
 * @param {string} transcript - The transcribed student speech
 * @param {string|null} referenceText - Optional reference/prompt text for the assignment
 * @param {string|null} partType - KET part type: part1 | part2 | part3 | free | null
 * @returns {Promise<GradeResult>}
 */
export async function gradeSubmission(transcript, referenceText = null, partType = null) {
  const openai = getClient()

  const partGuidance = (partType && PART_TYPE_GUIDANCE[partType]) || ''

  const systemPrompt = `You are an experienced KET (Key English Test) oral examiner evaluating a student's spoken English. The students are aged 10-14 and are preparing for the Cambridge KET exam. You must be encouraging yet constructive.
${partGuidance}
Evaluate the submission on exactly these 5 dimensions (each scored 1-100):
1. pronunciation_score – Clarity and accuracy of pronunciation
2. fluency_score – Natural flow, pace, pausing, and rhythm
3. grammar_score – Grammatical accuracy appropriate for KET level
4. content_score – Completeness, relevance, and richness of content
5. overall_score – Holistic KET oral band score (weighted average, but use your judgment)

Respond with ONLY a JSON object in this exact format:
{
  "pronunciation_score": <1-100>,
  "fluency_score": <1-100>,
  "grammar_score": <1-100>,
  "content_score": <1-100>,
  "overall_score": <1-100>,
  "feedback_en": "<2-3 sentence encouraging summary in English, highlight strengths then areas to improve>",
  "feedback_cn": "<2-3 sentence Chinese translation/summary of the feedback, written for a young student>",
  "corrections": [
    {
      "original": "<exact phrase from transcript with error>",
      "corrected": "<corrected version>",
      "explanation_en": "<brief English explanation of the error>",
      "explanation_cn": "<Chinese explanation suitable for ages 10-14>"
    }
  ],
  "practice_suggestions": [
    {
      "dimension": "<pronunciation|fluency|grammar|content>",
      "suggestion_cn": "<specific, actionable Chinese practice tip targeting this weak area>",
      "suggestion_en": "<English version of the tip>"
    }
  ]
}

The corrections array should list up to 5 most important errors. If the transcript is empty or too short (< 3 words), give very low scores and explain why.
The practice_suggestions array must contain exactly 2-3 suggestions targeting the student's weakest dimensions. Be very specific:
- For pronunciation: name the exact sounds/phonemes to practice (e.g. "练习 /θ/ 的发音，舌尖轻触上齿")
- For fluency: suggest shadowing exercises, timed speaking, or specific patterns
- For grammar: state the error pattern, the rule, and give 1-2 example sentences
- For content: suggest topic vocabulary lists, expansion strategies, or discussion prompts`

  const userPrompt = referenceText
    ? `Assignment prompt: "${referenceText}"\n\nStudent's transcribed speech:\n"${transcript}"`
    : `Student's transcribed speech:\n"${transcript}"`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0].message.content
  const result = JSON.parse(raw)

  // Validate and clamp scores to 1-100
  const clamp = (v) => Math.min(100, Math.max(1, Math.round(Number(v) || 1)))
  result.pronunciation_score = clamp(result.pronunciation_score)
  result.fluency_score = clamp(result.fluency_score)
  result.grammar_score = clamp(result.grammar_score)
  result.content_score = clamp(result.content_score)
  result.overall_score = clamp(result.overall_score)

  if (!Array.isArray(result.corrections)) result.corrections = []
  if (!Array.isArray(result.practice_suggestions)) result.practice_suggestions = []

  return result
}

/**
 * Get a score label and color for a numeric score (1-100).
 */
export function scoreLabel(score) {
  if (score >= 90) return { label: '优秀', color: 'text-emerald-600', bg: 'bg-emerald-50' }
  if (score >= 75) return { label: '良好', color: 'text-blue-600', bg: 'bg-blue-50' }
  if (score >= 60) return { label: '及格', color: 'text-yellow-600', bg: 'bg-yellow-50' }
  return { label: '待提高', color: 'text-red-500', bg: 'bg-red-50' }
}
