import { NextRequest, NextResponse } from 'next/server'
import { generateImagePromptFromDescription } from '@/lib/qwen'
import { generateWanxImage, downloadImage } from '@/lib/wanx'
import { uploadToOSS } from '@/lib/oss'

export const runtime = 'nodejs'

function buildOssWatermarkUrl(url: string, text: string) {
  try {
    const textBase64 = Buffer.from(text).toString('base64')
    const fontBase64 = Buffer.from('wqy-zenhei').toString('base64')
    const params = [
      'x-oss-process=watermark',
      'type_text',
      `text_${textBase64}`,
      `font_${fontBase64}`,
      'size_28',
      'color_999999',
      't_60',
      'g_se',
      'x_30',
      'y_30',
    ].join(',')
    return `${url}?${params}`
  } catch {
    return url
  }
}

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json()
    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: '缺少描述' }, { status: 400 })
    }

    const prompt = await generateImagePromptFromDescription(description)
    const generatedUrl = await generateWanxImage(prompt)
    const imageBuffer = await downloadImage(generatedUrl)

    const fileName = `ai-${Date.now()}.png`
    const originUrl = await uploadToOSS(imageBuffer, fileName, 'image/png')
    const imageUrl = buildOssWatermarkUrl(originUrl, '衣序 AI')

    return NextResponse.json({
      success: true,
      imageUrl,
      thumbnail: `${originUrl}?x-oss-process=image/resize,w_300/watermark,type_text,text_${Buffer.from('衣序 AI').toString('base64')},font_${Buffer.from('wqy-zenhei').toString('base64')},size_20,color_999999,t_60,g_se,x_20,y_20`,
      prompt,
    })
  } catch (error) {
    console.error('AI生成失败:', error)
    return NextResponse.json({ error: 'AI生成失败' }, { status: 500 })
  }
}
