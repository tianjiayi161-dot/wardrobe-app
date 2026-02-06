import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { ObjectId } from 'mongodb'

// GET - 获取日程列表
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const collection = await getCollection('schedules')
    const schedules = await collection
      .find({ userId: new ObjectId(userId) })
      .sort({ date: 1, createdAt: -1 })
      .toArray()

    const formatted = schedules.map((item) => ({
      ...item,
      _id: item._id.toString(),
      userId: item.userId.toString(),
    }))

    return NextResponse.json({ success: true, schedules: formatted })
  } catch (error) {
    console.error('获取日程失败:', error)
    return NextResponse.json({ error: '获取日程失败' }, { status: 500 })
  }
}

// POST - 新建日程
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, date, type, outfitId, clothingIds, tips, repeatType, repeatDays } = body || {}

    if (!title || !date || !type) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    const collection = await getCollection('schedules')
    const clothesCollection = await getCollection('clothes')
    const outfitsCollection = await getCollection('outfits')
    const now = new Date()
    const result = await collection.insertOne({
      userId: new ObjectId(userId),
      title,
      date,
      type,
      outfitId: outfitId || undefined,
      clothingIds: Array.isArray(clothingIds) ? clothingIds : undefined,
      tips: Array.isArray(tips) ? tips : undefined,
      repeatType: repeatType || 'none',
      repeatDays: Array.isArray(repeatDays) ? repeatDays : [],
      createdAt: now,
      updatedAt: now,
    })

    const resolveClothingIds = async (): Promise<string[]> => {
      if (type === 'outfit' && outfitId) {
        if (!ObjectId.isValid(outfitId)) return []
        const outfit = await outfitsCollection.findOne({
          _id: new ObjectId(outfitId),
          userId: new ObjectId(userId),
        })
        return (outfit?.clothingIds as string[]) || []
      }
      if (type === 'clothes') {
        return Array.isArray(clothingIds) ? clothingIds : []
      }
      return []
    }

    const clothingIdsToInc = await resolveClothingIds()
    const objectIds = clothingIdsToInc.filter(ObjectId.isValid).map((id) => new ObjectId(id))
    if (objectIds.length > 0) {
      await clothesCollection.updateMany(
        { _id: { $in: objectIds }, userId: new ObjectId(userId) },
        { $inc: { wearCount: 1 } }
      )
    }

    return NextResponse.json({
      success: true,
      schedule: {
        _id: result.insertedId.toString(),
        userId,
        title,
        date,
        type,
        outfitId: outfitId || undefined,
        clothingIds: Array.isArray(clothingIds) ? clothingIds : undefined,
        tips: Array.isArray(tips) ? tips : undefined,
        repeatType: repeatType || 'none',
        repeatDays: Array.isArray(repeatDays) ? repeatDays : [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    })
  } catch (error) {
    console.error('创建日程失败:', error)
    return NextResponse.json({ error: '创建日程失败' }, { status: 500 })
  }
}
