import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { hashPassword, verifyPassword, isValidPassword } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    const validation = isValidPassword(newPassword)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || '密码不符合要求' }, { status: 400 })
    }

    const users = await getCollection('users')
    const user = await users.findOne({ _id: new ObjectId(userId) })
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const ok = await verifyPassword(currentPassword, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: '当前密码错误' }, { status: 400 })
    }

    const newHash = await hashPassword(newPassword)
    await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { passwordHash: newHash, updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('修改密码失败:', error)
    return NextResponse.json({ error: '修改失败' }, { status: 500 })
  }
}
