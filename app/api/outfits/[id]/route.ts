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
    const { id } = await params
    const outfitsCollection = await getCollection('outfits')
    const clothesCollection = await getCollection('clothes')

    const outfit = await outfitsCollection.findOne({ _id: new ObjectId(id) })

    if (!outfit) {
      return NextResponse.json(
        { error: '搭配不存在' },
        { status: 404 }
      )
    }

    // 获取关联的衣服详情
    const clothes = await clothesCollection
      .find({
        _id: { $in: outfit.clothingIds.map((id: string) => new ObjectId(id)) },
      })
      .toArray()

    return NextResponse.json({
      success: true,
      outfit: {
        ...outfit,
        _id: outfit._id.toString(),
      },
      clothes: clothes.map((c) => ({
        ...c,
        _id: c._id.toString(),
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
    const { id } = await params
    const updates = await request.json()
    const collection = await getCollection('outfits')

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json(
        { error: '搭配不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      outfit: {
        ...result,
        _id: result._id.toString(),
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
    const { id } = await params
    const collection = await getCollection('outfits')

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: '搭配不存在' },
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
