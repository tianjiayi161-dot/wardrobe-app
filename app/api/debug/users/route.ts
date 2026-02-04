import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'

// 临时调试路由：检查用户数据
export async function GET(request: NextRequest) {
  try {
    const users = await getCollection('users')
    const allUsers = await users.find({}).toArray()

    return NextResponse.json({
      success: true,
      count: allUsers.length,
      users: allUsers.map(u => ({
        _id: u._id.toString(),
        email: u.email,
        name: u.name,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        hasPasswordHash: !!u.passwordHash,
      }))
    })
  } catch (error) {
    console.error('获取用户失败:', error)
    return NextResponse.json(
      { error: '获取用户失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
