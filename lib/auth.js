import crypto from 'crypto'

const SECRET = process.env.AUTH_SECRET || 'ket_grader_secret_2024'

export function signToken(payload) {
  const data = JSON.stringify(payload)
  const b64 = Buffer.from(data).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(b64).digest('base64url')
  return `${b64}.${sig}`
}

export function verifyToken(token) {
  if (!token) return null
  try {
    const [b64, sig] = token.split('.')
    const expected = crypto.createHmac('sha256', SECRET).update(b64).digest('base64url')
    if (sig !== expected) return null
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString())
    // Token expires after 24 hours
    if (Date.now() - payload.iat > 24 * 60 * 60 * 1000) return null
    return payload
  } catch {
    return null
  }
}
