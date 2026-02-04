import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { normalizeCategory } from '@/lib/utils'

// GET - 获取单个搭配详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 从 middleware 获取 userId
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const outfitsCollection = await getCollection('outfits')
    const clothesCollection = await getCollection('clothes')

    // 验证所有权：查询时同时匹配 id 和 userId
    const outfit = await outfitsCollection.findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId)
    })

    if (!outfit) {
      return NextResponse.json(
        { error: '搭配不存在或无权访问' },
        { status: 404 }
      )
    }

    // 获取关联的衣服详情（也验证用户权限）
    const clothes = await clothesCollection
      .find({
        _id: { $in: outfit.clothingIds.map((id: string) => new ObjectId(id)) },
        userId: new ObjectId(userId)  // 确保衣服也属于当前用户
      })
      .toArray()

    return NextResponse.json({
      success: true,
      outfit: {
        ...outfit,
        _id: outfit._id.toString(),
        userId: outfit.userId.toString(),
      },
      clothes: clothes.map((c) => ({
        ...c,
        _id: c._id.toString(),
        userId: c.userId.toString(),
        category: normalizeCategory(c.category),
      })),
    })
  } catch (error) {
    console.error('获取搭配详情失败:', error)
    return NextResponse.json(
      { error: '获取搭配详情失败' },
      { status: 500 }
    )
  }
}

// PUT - 更新搭配信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 从 middleware 获取 userId
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const updates = await request.json()
    const collection = await getCollection('outfits')

    // 验证所有权：更新时同时匹配 id 和 userId
    const result = await collection.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        userId: new ObjectId(userId)
      },
      { $set: updates },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json(
        { error: '搭配不存在或无权修改' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      outfit: {
        ...result,
        _id: result._id.toString(),
        userId: result.userId.toString(),
      },
    })
  } catch (error) {
    console.error('更新搭配失败:', error)
    return NextResponse.json(
      { error: '更新搭配失败' },
      { status: 500 }
    )
  }
}

// DELETE - 删除搭配
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 从 middleware 获取 userId
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const collection = await getCollection('outfits')

    // 验证所有权：删除时同时匹配 id 和 userId
    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: '搭配不存在或无权删除' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    })
  } catch (error) {
    console.error('删除搭配失败:', error)
    return NextResponse.json(
      { error: '删除搭配失败' },
      { status: 500 }
    )
  }
}
