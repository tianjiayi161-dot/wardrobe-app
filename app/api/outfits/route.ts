import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { CreateOutfitInput } from '@/types'
import { ObjectId } from 'mongodb'

// GET - 获取所有搭配
export async function GET(request: NextRequest) {
  try {
    // 从 middleware 获取 userId
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const season = searchParams.get('season')

    const collection = await getCollection('outfits')

    // 构建查询条件 - 只查询当前用户的搭配
    const query: any = { userId: new ObjectId(userId) }
    if (season) query.season = season

    const outfits = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    // 转换_id和userId为字符串
    const formattedOutfits = outfits.map((item) => ({
      ...item,
      _id: item._id.toString(),
      userId: item.userId.toString(),
      createdAt: item.createdAt,
    }))

    return NextResponse.json({
      success: true,
      outfits: formattedOutfits,
    })
  } catch (error) {
    console.error('获取搭配列表失败:', error)
    return NextResponse.json(
      { error: '获取搭配列表失败' },
      { status: 500 }
    )
  }
}

// POST - 创建新搭配
export async function POST(request: NextRequest) {
  try {
    // 从 middleware 获取 userId
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const input: CreateOutfitInput = await request.json()

    // 验证必填字段
    if (!input.name || !input.clothingIds || input.clothingIds.length === 0) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    const collection = await getCollection('outfits')

    const newOutfit = {
      userId: new ObjectId(userId),  // 添加用户ID
      name: input.name,
      description: input.description || '',
      clothingIds: input.clothingIds,
      occasion: input.occasion,
      season: input.season,
      isAIGenerated: input.isAIGenerated || false,
      tags: input.tags || [],
      createdAt: new Date(),
    }

    const result = await collection.insertOne(newOutfit)

    return NextResponse.json({
      success: true,
      outfit: {
        ...newOutfit,
        _id: result.insertedId.toString(),
        userId: userId,  // 返回字符串形式的userId
      },
    })
  } catch (error) {
    console.error('创建搭配失败:', error)
    return NextResponse.json(
      { error: '创建搭配失败' },
      { status: 500 }
    )
  }
}
