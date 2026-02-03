import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { deleteFromOSS } from '@/lib/oss'
import { ObjectId } from 'mongodb'

// GET - 获取单个衣服详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const collection = await getCollection('clothes')

    const clothing = await collection.findOne({ _id: new ObjectId(id) })

    if (!clothing) {
      return NextResponse.json(
        { error: '衣服不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      clothing: {
        ...clothing,
        _id: clothing._id.toString(),
      },
    })
  } catch (error) {
    console.error('获取衣服详情失败:', error)
    return NextResponse.json(
      { error: '获取衣服详情失败' },
      { status: 500 }
    )
  }
}

// PUT - 更新衣服信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updates = await request.json()
    const collection = await getCollection('clothes')

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json(
        { error: '衣服不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      clothing: {
        ...result,
        _id: result._id.toString(),
      },
    })
  } catch (error) {
    console.error('更新衣服失败:', error)
    return NextResponse.json(
      { error: '更新衣服失败' },
      { status: 500 }
    )
  }
}

// DELETE - 删除衣服
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const collection = await getCollection('clothes')

    // 先获取衣服信息（用于删除OSS图片）
    const clothing = await collection.findOne({ _id: new ObjectId(id) })

    if (!clothing) {
      return NextResponse.json(
        { error: '衣服不存在' },
        { status: 404 }
      )
    }

    // 删除数据库记录
    await collection.deleteOne({ _id: new ObjectId(id) })

    // 尝试删除OSS图片（失败不影响整体流程）
    try {
      await deleteFromOSS(clothing.imageUrl)
    } catch (error) {
      console.error('删除OSS图片失败:', error)
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    })
  } catch (error) {
    console.error('删除衣服失败:', error)
    return NextResponse.json(
      { error: '删除衣服失败' },
      { status: 500 }
    )
  }
}
