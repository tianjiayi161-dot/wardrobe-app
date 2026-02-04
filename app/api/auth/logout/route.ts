import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (token) {
      // Delete session from database
      const sessions = await getCollection('sessions')
      await sessions.deleteOne({ token })
    }

    // Clear cookie
    const response = NextResponse.json({ success: true })
    response.cookies.delete('auth-token')

    return response
  } catch (error) {
    console.error('登出失败:', error)
    return NextResponse.json(
      { error: '登出失败' },
      { status: 500 }
    )
  }
}
