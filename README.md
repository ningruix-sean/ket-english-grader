# KET English Oral Practice Grader

A web app for KET English oral practice with AI-powered grading. Students record or upload audio, Whisper transcribes it, and GPT-4o evaluates pronunciation, fluency, grammar, content, and gives bilingual (EN/CN) feedback.

## Tech Stack

- **Next.js 14** App Router
- **Tailwind CSS** (mobile-first)
- **SQLite** via `better-sqlite3`
- **OpenAI** Whisper (transcription) + GPT-4o (grading)
- Port: **3100**

## Quick Start

```bash
cp .env.example .env.local
# Edit .env.local: set OPENAI_API_KEY

npm install
npm run dev
# → http://localhost:3100
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | Required. Your OpenAI API key |
| `TEACHER_PASSWORD` | `teacher123` | Teacher dashboard password |
| `DB_PATH` | `./data/grader.db` | SQLite database path |

## Routes

| Path | Description |
|---|---|
| `/` | Student submission page |
| `/teacher` | Teacher dashboard (password protected) |
| `/api/grade` | POST: receive audio → transcribe → grade → save |
| `/api/assignments` | CRUD assignments |
| `/api/submissions` | List submissions (teacher only), CSV export |
| `/api/auth` | POST: teacher login |

## Features

### Student Page (`/`)
- Enter name and class
- Record audio in browser (up to 2 minutes) or upload file
- Select assignment (if teacher created one)
- View grading report with:
  - 5-dimension scores (0-100) with progress bars
  - Bilingual feedback (EN + CN)
  - Error corrections with explanations
  - Full transcript

### Teacher Dashboard (`/teacher`)
- Password login (default: `teacher123`)
- Stats overview (total submissions, students, classes, avg score)
- Submissions table with filters (class, date range, score range)
- Click any row to expand full details
- Export filtered results as CSV (Excel-compatible UTF-8)
- Create/delete assignments with reference text

### Grading Dimensions
1. **Pronunciation** (发音准确度) — clarity and accuracy
2. **Fluency** (流利度) — natural flow and rhythm
3. **Grammar** (语法正确性) — grammatical accuracy at KET level
4. **Content** (内容完整度) — completeness and relevance
5. **Overall** (综合评分) — holistic KET oral band score

## Database Schema

```sql
assignments (id, title, description, reference_text, class_name, created_at, active)
submissions (id, student_name, class_name, assignment_id, audio_filename, transcript,
             pronunciation_score, fluency_score, grammar_score, content_score, overall_score,
             feedback_en, feedback_cn, corrections, submitted_at)
```

The database auto-initializes on first run. Data is stored in `./data/grader.db`.

## Known Issues

- **`serverExternalPackages` warning in next.config.js** — Next.js may emit a warning about `serverExternalPackages` being unrecognized. This is a known issue and does not affect runtime behavior; the webpack `externals` configuration in `next.config.js` serves as a fallback to ensure `better-sqlite3` is correctly excluded from bundling.
