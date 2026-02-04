import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { hashPassword, generateToken, createSession, isValidEmail, isValidPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      )
    }

    const passwordValidation = isValidPassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      )
    }

    const users = await getCollection('users')

    // Check if user already exists
    const existingUser = await users.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 409 }
      )
    }

    // Create user
    const passwordHash = await hashPassword(password)
    const result = await users.insertOne({
      email: email.toLowerCase(),
      passwordHash,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: false,
    })

    const userId = result.insertedId.toString()

    // Generate token and create session
    const token = generateToken(userId)
    await createSession(userId, token)

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      user: {
        _id: userId,
        email: email.toLowerCase(),
        name,
        emailVerified: false,
      },
    })

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('注册失败:', error)
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    )
  }
}
