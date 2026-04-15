import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DB_PATH || './data/grader.db'

let db = null

function getDb() {
  if (db) return db

  // Ensure data directory exists
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  initSchema()
  return db
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      reference_text TEXT,
      class_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      class_name TEXT NOT NULL,
      assignment_id INTEGER REFERENCES assignments(id),
      audio_filename TEXT,
      transcript TEXT,
      pronunciation_score INTEGER,
      fluency_score INTEGER,
      grammar_score INTEGER,
      content_score INTEGER,
      overall_score INTEGER,
      feedback_en TEXT,
      feedback_cn TEXT,
      corrections TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_submissions_class ON submissions(class_name);
    CREATE INDEX IF NOT EXISTS idx_submissions_date ON submissions(submitted_at);
    CREATE INDEX IF NOT EXISTS idx_submissions_score ON submissions(overall_score);
  `)

  // Migrations: add new columns if they don't exist (safe for existing DBs)
  try { db.exec(`ALTER TABLE assignments ADD COLUMN part_type TEXT DEFAULT 'free'`) } catch {}
  try { db.exec(`ALTER TABLE submissions ADD COLUMN practice_suggestions TEXT`) } catch {}
}

// ── Assignments ──────────────────────────────────────────────────────────────

export function getActiveAssignments(className) {
  const db = getDb()
  if (className) {
    return db.prepare(`
      SELECT * FROM assignments
      WHERE active = 1 AND (class_name IS NULL OR class_name = '' OR class_name = ?)
      ORDER BY created_at DESC
    `).all(className)
  }
  return db.prepare(`
    SELECT * FROM assignments WHERE active = 1 ORDER BY created_at DESC
  `).all()
}

export function getAllAssignments() {
  return getDb().prepare(`
    SELECT * FROM assignments ORDER BY created_at DESC
  `).all()
}

export function createAssignment({ title, description, reference_text, class_name, part_type }) {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO assignments (title, description, reference_text, class_name, part_type)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, description || null, reference_text || null, class_name || null, part_type || 'free')
  return result.lastInsertRowid
}

export function updateAssignment(id, fields) {
  const db = getDb()
  const { title, description, reference_text, class_name, active, part_type } = fields
  db.prepare(`
    UPDATE assignments SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      reference_text = COALESCE(?, reference_text),
      class_name = COALESCE(?, class_name),
      active = COALESCE(?, active),
      part_type = COALESCE(?, part_type)
    WHERE id = ?
  `).run(title ?? null, description ?? null, reference_text ?? null, class_name ?? null, active ?? null, part_type ?? null, id)
}

export function deleteAssignment(id) {
  getDb().prepare('UPDATE assignments SET active = 0 WHERE id = ?').run(id)
}

// ── Submissions ──────────────────────────────────────────────────────────────

export function createSubmission(data) {
  const db = getDb()
  const {
    student_name, class_name, assignment_id,
    audio_filename, transcript,
    pronunciation_score, fluency_score, grammar_score, content_score, overall_score,
    feedback_en, feedback_cn, corrections, practice_suggestions
  } = data

  const result = db.prepare(`
    INSERT INTO submissions (
      student_name, class_name, assignment_id,
      audio_filename, transcript,
      pronunciation_score, fluency_score, grammar_score, content_score, overall_score,
      feedback_en, feedback_cn, corrections, practice_suggestions
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    student_name, class_name, assignment_id || null,
    audio_filename || null, transcript || null,
    pronunciation_score, fluency_score, grammar_score, content_score, overall_score,
    feedback_en || null, feedback_cn || null,
    typeof corrections === 'object' ? JSON.stringify(corrections) : corrections,
    typeof practice_suggestions === 'object' ? JSON.stringify(practice_suggestions) : practice_suggestions || null
  )
  return result.lastInsertRowid
}

export function getSubmissions({ class_name, student_name, date_from, date_to, min_score, max_score, limit = 200, offset = 0 } = {}) {
  const db = getDb()
  const conditions = []
  const params = []

  if (class_name) {
    conditions.push('s.class_name = ?')
    params.push(class_name)
  }
  if (student_name) {
    conditions.push('s.student_name LIKE ?')
    params.push(`%${student_name}%`)
  }
  if (date_from) {
    conditions.push('date(s.submitted_at) >= ?')
    params.push(date_from)
  }
  if (date_to) {
    conditions.push('date(s.submitted_at) <= ?')
    params.push(date_to)
  }
  if (min_score != null) {
    conditions.push('s.overall_score >= ?')
    params.push(Number(min_score))
  }
  if (max_score != null) {
    conditions.push('s.overall_score <= ?')
    params.push(Number(max_score))
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

  return db.prepare(`
    SELECT s.*, a.title as assignment_title, a.part_type
    FROM submissions s
    LEFT JOIN assignments a ON s.assignment_id = a.id
    ${where}
    ORDER BY s.submitted_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset)
}

export function getSubmission(id) {
  return getDb().prepare(`
    SELECT s.*, a.title as assignment_title, a.reference_text, a.part_type
    FROM submissions s
    LEFT JOIN assignments a ON s.assignment_id = a.id
    WHERE s.id = ?
  `).get(id)
}

export function getStudentHistory(studentName) {
  return getDb().prepare(`
    SELECT s.id, s.student_name, s.class_name,
           s.pronunciation_score, s.fluency_score, s.grammar_score, s.content_score, s.overall_score,
           s.submitted_at, a.title as assignment_title, a.part_type
    FROM submissions s
    LEFT JOIN assignments a ON s.assignment_id = a.id
    WHERE s.student_name = ?
    ORDER BY s.submitted_at ASC
  `).all(studentName)
}

export function getDistinctClasses() {
  return getDb().prepare(`
    SELECT DISTINCT class_name FROM submissions
    WHERE class_name IS NOT NULL AND class_name != ''
    ORDER BY class_name
  `).all().map(r => r.class_name)
}

export function getStats() {
  const db = getDb()
  return db.prepare(`
    SELECT
      COUNT(*) as total_submissions,
      COUNT(DISTINCT student_name) as total_students,
      COUNT(DISTINCT class_name) as total_classes,
      ROUND(AVG(overall_score), 1) as avg_score,
      MAX(overall_score) as max_score,
      MIN(overall_score) as min_score
    FROM submissions
  `).get()
}
