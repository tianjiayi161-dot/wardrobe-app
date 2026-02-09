import { NextRequest, NextResponse } from 'next/server'
import { uploadToOSS } from '@/lib/oss'
import { removeBackgroundWithAliyun } from '@/lib/aliyun-cutout'
import { extractAttributesFromImage } from '@/lib/image-pipeline'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('[cutout-env] endpoint:', !!process.env.ALIYUN_CUTOUT_ENDPOINT)
    console.log('[cutout-env] appcode:', !!process.env.ALIYUN_CUTOUT_APPCODE)

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '文件类型错误' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const imageBuffer = Buffer.from(arrayBuffer)

    const processedBuffer = await removeBackgroundWithAliyun(imageBuffer, file.type)
    const processedUrl = await uploadToOSS(
      processedBuffer,
      `processed-${Date.now()}.jpg`,
      'image/jpeg'
    )

    const labels = await extractAttributesFromImage(processedBuffer, 'image/jpeg')

    return NextResponse.json({
      success: true,
      imageUrl: processedUrl,
      thumbnail: `${processedUrl}?x-oss-process=image/resize,w_300`,
      labels,
    })
  } catch (error) {
    console.error('处理图片失败:', error)
    return NextResponse.json({ error: '处理图片失败' }, { status: 500 })
  }
}
