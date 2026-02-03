import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { generateOutfitRecommendations } from '@/lib/gemini'
import { Clothing } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { count = 3 } = await request.json()

    // 获取所有衣服
    const collection = await getCollection('clothes')
    const clothes = await collection.find({}).toArray()

    if (clothes.length < 2) {
      return NextResponse.json(
        { error: '衣橱中至少需要2件衣服才能生成推荐' },
        { status: 400 }
      )
    }

    // 转换格式
    const formattedClothes: Clothing[] = clothes.map((c) => ({
      ...c,
      _id: c._id.toString(),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))

    // 使用Gemini生成推荐
    const recommendations = await generateOutfitRecommendations(
      formattedClothes,
      count
    )

    return NextResponse.json({
      success: true,
      recommendations,
    })
  } catch (error) {
    console.error('生成推荐失败:', error)
    return NextResponse.json(
      { error: '生成推荐失败，请稍后重试' },
      { status: 500 }
    )
  }
}
