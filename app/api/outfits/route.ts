import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { CreateOutfitInput } from '@/types'

// GET - 获取所有搭配
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const season = searchParams.get('season')

    const collection = await getCollection('outfits')

    // 构建查询条件
    const query: any = {}
    if (season) query.season = season

    const outfits = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    // 转换_id为字符串
    const formattedOutfits = outfits.map((item) => ({
      ...item,
      _id: item._id.toString(),
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
