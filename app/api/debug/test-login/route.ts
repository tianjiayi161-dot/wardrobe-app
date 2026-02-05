import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Step 1: Check user exists
    const users = await getCollection('users')
    const user = await users.findOne({ email: email.toLowerCase() })

    if (!user) {
      return NextResponse.json({
        step: 'user_lookup',
        success: false,
        error: 'User not found',
        email: email.toLowerCase()
      })
    }

    // Step 2: Check password hash exists
    if (!user.passwordHash) {
      return NextResponse.json({
        step: 'hash_check',
        success: false,
        error: 'No password hash found',
        userEmail: user.email
      })
    }

    // Step 3: Test bcrypt compare
    const isValid = await bcrypt.compare(password, user.passwordHash)

    return NextResponse.json({
      step: 'complete',
      success: true,
      userFound: true,
      hasHash: true,
      passwordValid: isValid,
      hashPrefix: user.passwordHash.substring(0, 10),
      hashLength: user.passwordHash.length,
      userEmail: user.email,
      envCheck: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasMongoUri: !!process.env.MONGODB_URI,
        jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      }
    })
  } catch (error) {
    return NextResponse.json({
      step: 'error',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
