import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { CreateClothingInput } from '@/types'
import { ObjectId } from 'mongodb'

// GET - 获取所有衣服
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const season = searchParams.get('season')

    const collection = await getCollection('clothes')

    // 构建查询条件
    const query: any = {}
    if (category) query.category = category
    if (season) query.season = { $in: [season] }

    const clothes = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    // 转换_id为字符串
    const formattedClothes = clothes.map((item) => ({
      ...item,
      _id: item._id.toString(),
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
    const input: CreateClothingInput = await request.json()

    console.log('收到添加衣服请求:', {
      name: input.name,
      category: input.category,
      hasImageUrl: !!input.imageUrl,
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
      name: input.name,
      category: input.category,
      colors: input.colors || [],
      season: input.season || [],
      style: input.style || [],
      imageUrl: input.imageUrl,
      thumbnail: input.thumbnail || input.imageUrl,
      tags: input.tags || [],
      wearCount: 0,
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
