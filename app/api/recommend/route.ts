import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { generateOutfitRecommendations } from '@/lib/qwen'
import { Clothing } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { count = 3 } = await request.json()

    console.log('开始生成搭配推荐，数量:', count)

    // 获取所有衣服
    const collection = await getCollection('clothes')
    const clothes = await collection.find({}).toArray()

    console.log('衣橱中的衣服数量:', clothes.length)

    if (clothes.length < 2) {
      console.warn('衣服数量不足，无法生成推荐')
      return NextResponse.json(
        { error: `衣橱中至少需要2件衣服才能生成推荐（当前只有${clothes.length}件）` },
        { status: 400 }
      )
    }

    // 转换格式
    const formattedClothes: Clothing[] = clothes.map((c) => ({
      ...c,
      _id: c._id.toString(),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    } as Clothing))

    console.log('调用Gemini生成推荐...')
    // 使用Gemini生成推荐
    const recommendations = await generateOutfitRecommendations(
      formattedClothes,
      count
    )

    console.log('生成推荐成功，数量:', recommendations.length)

    if (recommendations.length === 0) {
      return NextResponse.json(
        { error: 'AI未能生成有效的搭配推荐，请稍后重试' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      recommendations,
    })
  } catch (error) {
    console.error('生成推荐失败 - 详细错误:', error)
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'no stack')
    return NextResponse.json(
      { error: `生成推荐失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    )
  }
}
