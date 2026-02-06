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
    const clothesCollection = await getCollection('clothes')
    const outfitsCollection = await getCollection('outfits')

    const existing = await collection.findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId),
    })
    if (!existing) {
      return NextResponse.json({ error: '日程不存在' }, { status: 404 })
    }
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

    const resolveClothingIds = async (
      scheduleType: string,
      scheduleOutfitId?: string,
      scheduleClothingIds?: string[]
    ): Promise<string[]> => {
      if (scheduleType === 'outfit' && scheduleOutfitId) {
        if (!ObjectId.isValid(scheduleOutfitId)) return []
        const outfit = await outfitsCollection.findOne({
          _id: new ObjectId(scheduleOutfitId),
          userId: new ObjectId(userId),
        })
        return (outfit?.clothingIds as string[]) || []
      }
      if (scheduleType === 'clothes') {
        return Array.isArray(scheduleClothingIds) ? scheduleClothingIds : []
      }
      return []
    }

    const beforeIds = new Set(
      await resolveClothingIds(existing.type, existing.outfitId, existing.clothingIds)
    )
    const afterIds = new Set(
      await resolveClothingIds(type, outfitId, clothingIds)
    )

    const toInc = [...afterIds].filter((id) => !beforeIds.has(id))
    const toDec = [...beforeIds].filter((id) => !afterIds.has(id))

    const toIncObj = toInc.filter(ObjectId.isValid).map((id) => new ObjectId(id))
    const toDecObj = toDec.filter(ObjectId.isValid).map((id) => new ObjectId(id))

    if (toIncObj.length > 0) {
      await clothesCollection.updateMany(
        { _id: { $in: toIncObj }, userId: new ObjectId(userId) },
        { $inc: { wearCount: 1 } }
      )
    }
    if (toDecObj.length > 0) {
      await clothesCollection.updateMany(
        { _id: { $in: toDecObj }, userId: new ObjectId(userId) },
        { $inc: { wearCount: -1 } }
      )
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
    const clothesCollection = await getCollection('clothes')
    const outfitsCollection = await getCollection('outfits')

    const existing = await collection.findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId),
    })
    if (!existing) {
      return NextResponse.json({ error: '日程不存在' }, { status: 404 })
    }

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: '日程不存在' }, { status: 404 })
    }

    const resolveClothingIds = async (): Promise<string[]> => {
      if (existing.type === 'outfit' && existing.outfitId) {
        if (!ObjectId.isValid(existing.outfitId)) return []
        const outfit = await outfitsCollection.findOne({
          _id: new ObjectId(existing.outfitId),
          userId: new ObjectId(userId),
        })
        return (outfit?.clothingIds as string[]) || []
      }
      if (existing.type === 'clothes') {
        return Array.isArray(existing.clothingIds) ? existing.clothingIds : []
      }
      return []
    }

    const clothingIdsToDec = await resolveClothingIds()
    const objectIds = clothingIdsToDec.filter(ObjectId.isValid).map((id) => new ObjectId(id))
    if (objectIds.length > 0) {
      await clothesCollection.updateMany(
        { _id: { $in: objectIds }, userId: new ObjectId(userId) },
        { $inc: { wearCount: -1 } }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除日程失败:', error)
    return NextResponse.json({ error: '删除日程失败' }, { status: 500 })
  }
}
