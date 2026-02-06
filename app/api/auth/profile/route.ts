import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { ObjectId } from 'mongodb'

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, avatar } = await request.json()
    const users = await getCollection('users')

    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      {
        $set: {
          name: name?.trim() || '',
          avatar: avatar?.trim() || '',
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: result._id.toString(),
        email: result.email,
        name: result.name,
        avatar: result.avatar,
        updatedAt: result.updatedAt,
      },
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
