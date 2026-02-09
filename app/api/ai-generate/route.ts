import { NextRequest, NextResponse } from 'next/server'
import { generateImagePromptFromDescription } from '@/lib/qwen'
import { generateWanxImage, downloadImage, addBrandWatermark } from '@/lib/wanx'
import { uploadToOSS } from '@/lib/oss'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json()
    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: '缺少描述' }, { status: 400 })
    }

    const prompt = await generateImagePromptFromDescription(description)
    const generatedUrl = await generateWanxImage(prompt)
    const imageBuffer = await downloadImage(generatedUrl)
    const watermarked = await addBrandWatermark(imageBuffer)

    const fileName = `ai-${Date.now()}.png`
    const imageUrl = await uploadToOSS(watermarked, fileName, 'image/png')

    return NextResponse.json({
      success: true,
      imageUrl,
      thumbnail: `${imageUrl}?x-oss-process=image/resize,w_300`,
      prompt,
    })
  } catch (error) {
    console.error('AI生成失败:', error)
    return NextResponse.json({ error: 'AI生成失败' }, { status: 500 })
  }
}
