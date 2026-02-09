import { applyWhiteBackground } from '@/lib/image-pipeline'
import { uploadToOSS } from '@/lib/oss'

export async function removeBackgroundWithAliyun(
  imageBuffer: Buffer,
  mimeType: string
): Promise<Buffer> {
  const endpoint = process.env.ALIYUN_CUTOUT_ENDPOINT
  const appCode = process.env.ALIYUN_CUTOUT_APPCODE

  if (!endpoint || !appCode) {
    throw new Error('ALIYUN_CUTOUT_ENDPOINT 或 ALIYUN_CUTOUT_APPCODE 未配置')
  }

  const originUrl = await uploadToOSS(
    imageBuffer,
    `cutout-origin-${Date.now()}.jpg`,
    mimeType || 'image/jpeg'
  )

  const baseUrl = endpoint.startsWith('http')
    ? endpoint
    : `https://${endpoint}`

  const params = new URLSearchParams({
    Action: 'SegmentCommodity',
    Version: '2019-12-30',
    ImageURL: originUrl,
    ReturnForm: 'whiteBK',
    Format: 'JSON',
  })

  const res = await fetch(`${baseUrl}/?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `APPCODE ${appCode}`,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`阿里云抠图失败: ${res.status} ${text}`)
  }

  const contentType = res.headers.get('content-type') || ''
  let resultUrl = ''
  if (contentType.includes('application/json')) {
    const data = await res.json()
    resultUrl = data?.Data?.ImageURL || data?.data?.imageUrl || ''
  } else {
    const text = await res.text()
    const match = text.match(/<ImageURL>(.*?)<\/ImageURL>/)
    resultUrl = match?.[1] || ''
  }

  if (!resultUrl) {
    throw new Error('阿里云抠图返回为空')
  }

  const imageRes = await fetch(resultUrl)
  if (!imageRes.ok) {
    const text = await imageRes.text()
    throw new Error(`阿里云抠图结果下载失败: ${imageRes.status} ${text}`)
  }
  const arrayBuffer = await imageRes.arrayBuffer()
  const cutoutBuffer = Buffer.from(arrayBuffer)

  return applyWhiteBackground(cutoutBuffer)
}
