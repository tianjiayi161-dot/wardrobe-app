import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { getCollection } from './db'
import { ObjectId } from 'mongodb'

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
const TOKEN_EXPIRY = '7d' // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function generateToken(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuedAt()
    .sign(secret)
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return { userId: payload.userId as string }
  } catch {
    return null
  }
}

export async function createSession(userId: string, token: string) {
  const sessions = await getCollection('sessions')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await sessions.insertOne({
    userId: new ObjectId(userId),
    token,
    expiresAt,
    createdAt: new Date(),
  })
}

export async function getUserFromToken(token: string) {
  const payload = await verifyToken(token)
  if (!payload) return null

  const users = await getCollection('users')
  const user = await users.findOne({ _id: new ObjectId(payload.userId) })

  if (!user) return null

  return {
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    bio: user.bio,
    vibeTags: user.vibeTags,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password strength
export function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: '密码至少需要8个字符' }
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, error: '密码需包含大小写字母和数字' }
  }
  return { valid: true }
}
