import { NextRequest, NextResponse } from 'next/server'
import { uploadToOSS } from '@/lib/oss'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: '请选择要上传的图片' },
        { status: 400 }
      )
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '只能上传图片文件' },
        { status: 400 }
      )
    }

    // 检查文件大小（限制5MB）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '图片大小不能超过5MB' },
        { status: 400 }
      )
    }

    // 转换为Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 上传到OSS
    const imageUrl = await uploadToOSS(buffer, file.name, file.type)

    return NextResponse.json({
      success: true,
      imageUrl,
      thumbnail: `${imageUrl}?x-oss-process=image/resize,w_300`,
    })
  } catch (error) {
    console.error('上传失败:', error)
    return NextResponse.json(
      { error: '图片上传失败' },
      { status: 500 }
    )
  }
}
