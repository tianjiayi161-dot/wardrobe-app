import { NextRequest, NextResponse } from 'next/server'
import { analyzeClothingImage } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType } = await request.json()

    if (!imageBase64) {
      return NextResponse.json(
        { error: '请提供图片数据' },
        { status: 400 }
      )
    }

    // 使用Gemini分析图片
    const analysis = await analyzeClothingImage(imageBase64, mimeType || 'image/jpeg')

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    console.error('图片分析失败:', error)
    return NextResponse.json(
      { error: '图片分析失败，请稍后重试' },
      { status: 500 }
    )
  }
}
