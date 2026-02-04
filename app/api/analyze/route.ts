import { NextRequest, NextResponse } from 'next/server'
import { analyzeClothingImage, analyzeClothingImageEnhanced } from '@/lib/qwen'
import { analyzeImageQuality } from '@/lib/image-processing'

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType, useEnhanced = true } = await request.json()

    if (!imageBase64) {
      return NextResponse.json(
        { error: '请提供图片数据' },
        { status: 400 }
      )
    }

    console.log('开始AI图片分析，使用增强模式:', useEnhanced)

    // 图片质量检测
    let qualityWarnings: string[] = []
    try {
      const imageBuffer = Buffer.from(
        imageBase64.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      )
      const quality = await analyzeImageQuality(imageBuffer)
      qualityWarnings = quality.warnings
      console.log('图片质量检测完成:', quality)
    } catch (e) {
      console.warn('图片质量分析失败:', e)
    }

    // 使用AI分析（增强或快速）
    const analysis = useEnhanced
      ? await analyzeClothingImageEnhanced(imageBase64, mimeType || 'image/jpeg')
      : await analyzeClothingImage(imageBase64, mimeType || 'image/jpeg')

    console.log('AI分析结果:', analysis)

    return NextResponse.json({
      success: true,
      analysis,
      qualityWarnings,
    })
  } catch (error) {
    console.error('图片分析失败:', error)
    return NextResponse.json(
      { error: '图片分析失败，请稍后重试' },
      { status: 500 }
    )
  }
}
