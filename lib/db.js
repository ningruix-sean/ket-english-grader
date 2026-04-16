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

    -- V3: Question bank
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      subcategory TEXT,
      examiner_question TEXT NOT NULL,
      reference_answer TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);

    -- V3: Classes
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- V3: Homework
    CREATE TABLE IF NOT EXISTS homework (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      question_ids TEXT NOT NULL,
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE INDEX IF NOT EXISTS idx_homework_class ON homework(class_id);

    -- V3: Homework submissions
    CREATE TABLE IF NOT EXISTS homework_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      homework_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      student_name TEXT NOT NULL,
      transcript TEXT,
      score INTEGER,
      feedback TEXT,
      audio_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (homework_id) REFERENCES homework(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_hw_sub_homework ON homework_submissions(homework_id);
    CREATE INDEX IF NOT EXISTS idx_hw_sub_student ON homework_submissions(student_name);

    -- V3.1: Students roster & credits
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      credits INTEGER DEFAULT 10,
      total_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
  `)

  // Migrations: add new columns if they don't exist (safe for existing DBs)
  try { db.exec(`ALTER TABLE assignments ADD COLUMN part_type TEXT DEFAULT 'free'`) } catch {}
  try { db.exec(`ALTER TABLE submissions ADD COLUMN practice_suggestions TEXT`) } catch {}

  // V3: Seed question bank if empty
  seedQuestions()
}

function seedQuestions() {
  const count = db.prepare('SELECT COUNT(*) as c FROM questions').get().c
  if (count > 0) return

  const questions = [
    // ── greeting ──────────────────────────────────────────────────────
    ['greeting', '问候寒暄', 'How do you do?', 'How do you do.'],
    ['greeting', '问候寒暄', 'How are you, today?', 'Fine/Great. Thanks. And what about you?'],
    ['greeting', '问候寒暄', "It is a fine day today, isn't it?", "Yes, it is. / No, it isn't."],
    ['greeting', '问候寒暄', 'How is the weather today?', 'It is a sunny/cloudy/snowy/windy day today.'],
    ['greeting', '问候寒暄', 'What day is it today?', 'Today is Monday/Tuesday/Wednesday/Thursday/Friday/Saturday/Sunday.'],
    ['greeting', '问候寒暄', 'What date is it today?', 'Today is 1st/2nd/3rd/Fourth...31st, January/February...December.'],
    ['greeting', '问候寒暄', 'How did you get here this morning?', "I got here by bus. / I got here in my father's/mother's car."],
    ['greeting', '姓名相关', 'What is your name?', 'My name is Zhang Yixuan, Zhang is Family/Surname, Yixuan is Given Name.'],
    ['greeting', '姓名相关', 'May I know your name?', 'Sure, My name is Zhang Yixuan.'],
    ['greeting', '姓名相关', 'Can you spell your name, please?', 'Z-h-a-n-g Zhang, Y-i-x-u-a-n Yixuan.'],
    ['greeting', '姓名相关', 'What is your full name?', 'My full name is Zhang Yixuan.'],
    ['greeting', '姓名相关', 'What is your surname?', 'My surname is Zhang.'],
    ['greeting', '姓名相关', 'What is your family name?', 'My family name is Zhang.'],
    ['greeting', '姓名相关', 'Do you have an English name?', 'Yes, My English name is Castor.'],
    ['greeting', '姓名相关', 'What is your English name?', 'My English name is Castor.'],
    ['greeting', '个人信息', 'When is your birthday?', 'My birthday is 24th November, 2011.'],
    ['greeting', '个人信息', 'How old are you?', 'I am 9 years old.'],
    ['greeting', '个人信息', 'When were you born?', 'I was born on 24th November, 2011.'],
    ['greeting', '个人信息', 'Where were you born?', 'I was born in Shenyang City, Liaoning Province.'],
    ['greeting', '个人信息', 'Were you born in this city?', 'Yes, I was born in this city.'],
    ['greeting', '个人信息', 'Are you local people?', 'Yes, I have been living here for 9 years.'],
    ['greeting', '个人信息', 'Where are you from?', 'I am from Shenyang City, Liaoning Province.'],
    ['greeting', '个人信息', 'Where do you come from?', 'I come from Shenyang City, Liaoning Province.'],
    ['greeting', '个人信息', 'Where do you live?', 'I live in No.37 Beiyixi Road, Tiexi District, Shenyang City.'],
    ['greeting', '学校相关', 'What school are you studying at?', 'I am studying at Qigonger Primary School.'],
    ['greeting', '学校相关', 'Which grade are you in?', 'I am in Grade 3.'],
    ['greeting', '学校相关', 'How far is your home from your school?', 'Around 1.5 Kilometer, two stops by bus.'],
    ['greeting', '学校相关', 'How long does it take you to get to school?', 'It takes me 20 minutes by bus.'],
    ['greeting', '学校相关', 'When do you go to school every day?', "I usually go to school at 7 o'clock."],
    ['greeting', '学校相关', 'How do you get to school every day?', 'I usually go to school by bus.'],
    ['greeting', '学校相关', 'Which class are you in?', 'I am in Class 1, Grade 3.'],
    ['greeting', '学校相关', 'How many students are there in your class?', 'There are 48 students in my class.'],
    ['greeting', '学校相关', 'Do you like your school?', 'Yes, I like my school. There are nice teachers and friendly classmates.'],
    ['greeting', '学校相关', 'Is there a library at your school?', 'Yes, there is a library at my school.'],
    ['greeting', '学校相关', "When does the first lesson start?", "The first lesson starts at 8 O'clock."],
    ['greeting', '学校相关', 'How many subjects do you have?', 'I have 3 main subjects: Chinese, Math and English.'],
    ['greeting', '学校相关', 'What is your favorite subject?', 'My favorite subject is English. It could help me to know the world better.'],
    ['greeting', '学校相关', 'Do you like learning English?', 'Yes, I like learning English.'],
    ['greeting', '学校相关', 'Are you good at English?', 'Yes, I am good at English.'],
    ['greeting', '课后活动', 'What do you do after school?', 'I usually go home directly after school, and do my homework.'],
    ['greeting', '课后活动', 'Do you like sports?', 'Yes, I like sports. Especially basketball.'],
    ['greeting', '课后活动', 'What kind of sport do you like best?', 'I like basketball best.'],

    // ── daily_life ────────────────────────────────────────────────────
    ['daily_life', '家庭', 'How many people are there in your family?', 'There are four people in my family.'],
    ['daily_life', '家庭', 'Do you love your family?', 'Yes, I love my family very much.'],
    ['daily_life', '家庭', 'How old is your father/mother?', 'My father is 40 years old. / My mother is 36 years old.'],
    ['daily_life', '家庭', "What is your father's job?", 'My father is a teacher.'],
    ['daily_life', '家庭', 'Do you often help your parents with housework?', 'Yes, I often help my parents with housework.'],
    ['daily_life', '家庭', 'Do you have any brothers or sisters?', 'Yes, I have a twin brother.'],
    ['daily_life', '家庭', 'How often do you visit your grandparents?', 'Every weekend.'],
    ['daily_life', '家庭', 'How many rooms are there in your house?', 'There are 3 rooms in my house.'],
    ['daily_life', '学习生活', 'How much homework do you do every day?', 'I need about 1 hour to finish my homework every day.'],
    ['daily_life', '学习生活', 'Can you cook at home?', 'No, I can\'t. My parents do not allow me to cook at home.'],
    ['daily_life', '动物宠物', 'Do you like animals?', 'Yes, I do. And I like cats best.'],
    ['daily_life', '动物宠物', 'Do you have a pet?', 'Yes, I have two tortoises.'],
    ['daily_life', '动物宠物', 'Can you describe your pet?', 'I bought them from market 5 years ago, and they like eating small fish.'],
    ['daily_life', '日常作息', 'What time do you get up every day?', 'I always get up around 6:30 every day.'],
    ['daily_life', '日常作息', 'What do you have for breakfast?', 'I have bread and milk for breakfast.'],
    ['daily_life', '饮食', 'What kind of food do you like best?', 'I like fried chicken best.'],
    ['daily_life', '饮食', 'What is your favourite food?', 'My favourite food is Pizza.'],
    ['daily_life', '饮食', 'Do you like eating fruit?', 'Yes, I do. I like watermelon best.'],
    ['daily_life', '日常作息', 'What do you usually do in the evening?', 'I usually watch TV in the evening.'],
    ['daily_life', '日常作息', "What time do you usually go to bed?", "I usually go to bed at 9 o'clock."],
    ['daily_life', '兴趣爱好', 'What do you do in your free time?', 'I play games with my brother in my free time.'],
    ['daily_life', '兴趣爱好', 'What is your hobby?', 'My hobby is playing basketball.'],
    ['daily_life', '兴趣爱好', 'What do you usually do on weekends?', 'I usually learn art and basketball on weekends.'],
    ['daily_life', '兴趣爱好', 'What did you do last weekend?', 'I went to sports center to learn basketball.'],
    ['daily_life', '兴趣爱好', 'Do you know how to use a computer?', 'Yes, I do. I usually use it to search information for learning.'],
    ['daily_life', '兴趣爱好', 'Do you like playing computer games?', "No, I don't. My parents don't allow me."],
    ['daily_life', '社交', 'Do you have many friends?', 'Yes, I have lots of friends. My best friend is Tony.'],
    ['daily_life', '社交', 'Do you like making friends?', 'Yes, I do. I like making friends with people who are kind.'],
    ['daily_life', '社交', 'What does your best friend look like?', 'He is taller than me, and he likes playing basketball too.'],
    ['daily_life', '社交', 'What do you usually do with your friends?', 'We usually play basketball together.'],
    ['daily_life', '兴趣爱好', 'What is your favourite season?', 'My favourite season is summer, because I can go swimming.'],
    ['daily_life', '兴趣爱好', 'Do you like reading books?', 'Yes, I like reading story books.'],
    ['daily_life', '兴趣爱好', 'Can you play the piano?', "No, I can't. But I want to learn it."],
    ['daily_life', '兴趣爱好', 'What sort of music do you like?', 'I like pop music.'],
    ['daily_life', '兴趣爱好', 'What colour do you like best?', 'I like blue best.'],

    // ── others ────────────────────────────────────────────────────────
    ['others', '综合描述', 'Tell me something about your hobbies.', 'My hobby is playing basketball. I play it every weekend.'],
    ['others', '综合描述', 'Tell me something about your family.', 'There are four people in my family. We are a happy family.'],
    ['others', '综合描述', 'Tell me something about your school.', 'My school is beautiful. There are nice teachers and friendly classmates.'],
    ['others', '天气季节', 'Can you describe the weather today?', 'It is a sunny day today. The temperature is about 20 degrees.'],
    ['others', '天气季节', 'What do you like doing in summer?', 'I like swimming in summer.'],
    ['others', '天气季节', 'What do you like doing in winter?', 'I like making snowmen in winter.'],
    ['others', '节日文化', 'How do you celebrate Spring Festival?', 'We have a big dinner with family, and we get red packets.'],
    ['others', '个人特点', 'What is your difference from other students?', 'I think I am more creative than other students.'],
    ['others', '天气季节', 'How many seasons are there in a year?', 'There are four seasons: spring, summer, autumn and winter.'],
    ['others', '旅行经历', 'Have you ever been to Beijing?', 'Yes, I have been to Beijing. I visited the Great Wall.'],
    ['others', '旅行经历', 'Do you like travelling?', 'Yes, I like travelling. I want to visit many cities.'],
    ['others', '家乡描述', 'Can you describe your hometown?', 'My hometown is Shenyang. It is a big city in northeast China.'],
    ['others', '未来计划', 'What are you going to be when you grow up?', 'I want to be a doctor when I grow up.'],
  ]

  const insert = db.prepare(
    'INSERT INTO questions (category, subcategory, examiner_question, reference_answer) VALUES (?, ?, ?, ?)'
  )
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(...row)
  })
  insertMany(questions)
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

// ── Questions (V3) ──────────────────────────────────────────────────────────

export function getQuestions(category) {
  const db = getDb()
  if (category) {
    return db.prepare('SELECT * FROM questions WHERE category = ? ORDER BY id').all(category)
  }
  return db.prepare('SELECT * FROM questions ORDER BY id').all()
}

export function getQuestion(id) {
  return getDb().prepare('SELECT * FROM questions WHERE id = ?').get(id)
}

// ── Classes (V3) ────────────────────────────────────────────────────────────

export function getAllClasses() {
  return getDb().prepare('SELECT * FROM classes ORDER BY created_at DESC').all()
}

export function createClass(name) {
  const result = getDb().prepare('INSERT INTO classes (name) VALUES (?)').run(name)
  return result.lastInsertRowid
}

export function deleteClass(id) {
  getDb().prepare('DELETE FROM classes WHERE id = ?').run(id)
}

// ── Homework (V3) ───────────────────────────────────────────────────────────

export function getHomeworkByClass(classId) {
  return getDb().prepare(`
    SELECT h.*, c.name as class_name
    FROM homework h
    JOIN classes c ON h.class_id = c.id
    WHERE h.class_id = ?
    ORDER BY h.created_at DESC
  `).all(classId)
}

export function getHomework(id) {
  return getDb().prepare(`
    SELECT h.*, c.name as class_name
    FROM homework h
    JOIN classes c ON h.class_id = c.id
    WHERE h.id = ?
  `).get(id)
}

export function createHomework({ class_id, title, question_ids, due_date }) {
  const result = getDb().prepare(
    'INSERT INTO homework (class_id, title, question_ids, due_date) VALUES (?, ?, ?, ?)'
  ).run(class_id, title, JSON.stringify(question_ids), due_date || null)
  return result.lastInsertRowid
}

export function deleteHomework(id) {
  getDb().prepare('DELETE FROM homework WHERE id = ?').run(id)
}

// ── Homework Submissions (V3) ───────────────────────────────────────────────

export function createHomeworkSubmission(data) {
  const { homework_id, question_id, student_name, transcript, score, feedback, audio_path } = data
  const result = getDb().prepare(`
    INSERT INTO homework_submissions (homework_id, question_id, student_name, transcript, score, feedback, audio_path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(homework_id, question_id, student_name, transcript || null, score || null, feedback || null, audio_path || null)
  return result.lastInsertRowid
}

export function getHomeworkSubmissions(homeworkId) {
  return getDb().prepare(`
    SELECT hs.*, q.examiner_question, q.reference_answer
    FROM homework_submissions hs
    JOIN questions q ON hs.question_id = q.id
    WHERE hs.homework_id = ?
    ORDER BY hs.student_name, hs.question_id
  `).all(homeworkId)
}

export function getStudentHomeworkSubmissions(homeworkId, studentName) {
  return getDb().prepare(`
    SELECT hs.*, q.examiner_question, q.reference_answer
    FROM homework_submissions hs
    JOIN questions q ON hs.question_id = q.id
    WHERE hs.homework_id = ? AND hs.student_name = ?
    ORDER BY hs.question_id
  `).all(homeworkId, studentName)
}

// ── Students (V3.1) ────────────────────────────────────────────────────────

export function getStudentsByClass(classId) {
  return getDb().prepare(`
    SELECT s.*, c.name as class_name
    FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE s.class_id = ?
    ORDER BY s.name
  `).all(classId)
}

export function getStudentById(id) {
  return getDb().prepare('SELECT * FROM students WHERE id = ?').get(id)
}

export function createStudents(classId, names) {
  const db = getDb()
  const insert = db.prepare('INSERT INTO students (class_id, name) VALUES (?, ?)')
  const ids = []
  const insertMany = db.transaction((rows) => {
    for (const name of rows) {
      const result = insert.run(classId, name)
      ids.push(result.lastInsertRowid)
    }
  })
  insertMany(names)
  return ids
}

export function deleteStudent(id) {
  getDb().prepare('DELETE FROM students WHERE id = ?').run(id)
}

export function addCredits(studentId, amount) {
  const db = getDb()
  db.prepare('UPDATE students SET credits = credits + ? WHERE id = ?').run(amount, studentId)
  return db.prepare('SELECT * FROM students WHERE id = ?').get(studentId)
}

export function addCreditsToClass(classId, amount) {
  getDb().prepare('UPDATE students SET credits = credits + ? WHERE class_id = ?').run(amount, classId)
}

export function verifyStudent(classId, name) {
  return getDb().prepare(
    'SELECT * FROM students WHERE class_id = ? AND TRIM(name) = ?'
  ).get(classId, name.trim())
}

export function consumeCredit(studentId) {
  const db = getDb()
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId)
  if (!student || student.credits <= 0) return null
  db.prepare('UPDATE students SET credits = credits - 1, total_used = total_used + 1 WHERE id = ?').run(studentId)
  return db.prepare('SELECT * FROM students WHERE id = ?').get(studentId)
}
