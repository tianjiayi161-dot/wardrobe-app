import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { CreateClothingInput } from '@/types'
import { normalizeCategory } from '@/lib/utils'
import { ObjectId } from 'mongodb'

// GET - 获取所有衣服
export async function GET(request: NextRequest) {
  try {
    // 从 middleware 获取 userId
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const season = searchParams.get('season')

    const collection = await getCollection('clothes')

    // 构建查询条件 - 只查询当前用户的衣服
    const query: any = { userId: new ObjectId(userId) }
    if (category) query.category = category
    if (season) query.season = { $in: [season] }

    const clothes = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    // 转换_id和userId为字符串
    const formattedClothes = clothes.map((item) => ({
      ...item,
      _id: item._id.toString(),
      userId: item.userId.toString(),
      category: normalizeCategory(item.category),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      clothes: formattedClothes,
    })
  } catch (error) {
    console.error('获取衣服列表失败:', error)
    return NextResponse.json(
      { error: '获取衣服列表失败' },
      { status: 500 }
    )
  }
}

// POST - 添加新衣服
export async function POST(request: NextRequest) {
  try {
    // 从 middleware 获取 userId
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const input: CreateClothingInput = await request.json()

    console.log('收到添加衣服请求:', {
      name: input.name,
      category: input.category,
      hasImageUrl: !!input.imageUrl,
      userId,
    })

    // 验证必填字段
    if (!input.name || !input.category || !input.imageUrl) {
      console.error('缺少必填字段:', { input })
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    console.log('正在连接MongoDB...')
    const collection = await getCollection('clothes')
    console.log('MongoDB连接成功')

    const newClothing = {
      userId: new ObjectId(userId),  // 添加用户ID
      name: input.name,
      category: input.category,
      colors: input.colors || [],
      season: input.season || [],
      style: input.style || [],
      imageUrl: input.imageUrl,
      thumbnail: input.thumbnail || input.imageUrl,
      tags: input.tags || [],
      wearCount: input.wearCount ?? 0,
      brand: input.brand || undefined,
      price: input.price || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log('正在插入数据...')
    const result = await collection.insertOne(newClothing)
    console.log('插入成功，ID:', result.insertedId.toString())

    return NextResponse.json({
      success: true,
      clothing: {
        ...newClothing,
        _id: result.insertedId.toString(),
        userId: userId,  // 返回字符串形式的userId
      },
    })
  } catch (error) {
    console.error('添加衣服失败 - 详细错误:', error)
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'no stack')
    return NextResponse.json(
      { error: `添加衣服失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    )
  }
}
