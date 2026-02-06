import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { ObjectId } from 'mongodb'

// PUT - 更新日程
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const body = await request.json()
    const { title, date, type, outfitId, clothingIds, tips, repeatType, repeatDays } = body || {}

    if (!title || !date || !type) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    const collection = await getCollection('schedules')
    const result = await collection.updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(userId) },
      {
        $set: {
          title,
          date,
          type,
          outfitId: outfitId || undefined,
          clothingIds: Array.isArray(clothingIds) ? clothingIds : undefined,
          tips: Array.isArray(tips) ? tips : undefined,
          repeatType: repeatType || 'none',
          repeatDays: Array.isArray(repeatDays) ? repeatDays : [],
          updatedAt: new Date(),
        },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: '日程不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新日程失败:', error)
    return NextResponse.json({ error: '更新日程失败' }, { status: 500 })
  }
}

// DELETE - 删除日程
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const collection = await getCollection('schedules')
    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: '日程不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除日程失败:', error)
    return NextResponse.json({ error: '删除日程失败' }, { status: 500 })
  }
}
