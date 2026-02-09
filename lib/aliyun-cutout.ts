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

  const url = endpoint.startsWith('http') ? endpoint : `https://${endpoint}`
  const base64 = imageBuffer.toString('base64')
  const originUrl = await uploadToOSS(
    imageBuffer,
    `cutout-origin-${Date.now()}.jpg`,
    mimeType || 'image/jpeg'
  )

  const callJson = async (payload: Record<string, string>) =>
    fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `APPCODE ${appCode}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

  const callForm = async (payload: Record<string, string>) => {
    const form = new URLSearchParams(payload)
    return fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `APPCODE ${appCode}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    })
  }

  const candidates: Array<() => Promise<Response>> = [
    () => callJson({ image: base64, image_type: 'BASE64' }),
    () => callJson({ img: base64 }),
    () => callForm({ image: base64 }),
    () => callJson({ image_url: originUrl }),
    () => callForm({ image_url: originUrl }),
  ]

  let res: Response | null = null
  let data: any = null
  for (const request of candidates) {
    res = await request()
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await res.text()
      throw new Error(`阿里云抠图失败: ${res.status} ${text}`)
    }
    data = await res.json()
    const msg = data?.msg || data?.message || ''
    if (!res.ok || data?.success === false) {
      if (String(msg).includes('图片不能为空')) {
        continue
      }
      throw new Error(`阿里云抠图失败: ${res.status} ${JSON.stringify(data)}`)
    }
    break
  }

  if (!data) {
    throw new Error('阿里云抠图失败: 未获得有效响应')
  }

  const base64Result =
    data?.data?.image ||
    data?.data?.result ||
    data?.result ||
    data?.image ||
    ''

  if (!base64Result) {
    throw new Error('阿里云抠图返回为空')
  }

  const cutoutBuffer = Buffer.from(
    base64Result.replace(/^data:image\/\w+;base64,/, ''),
    'base64'
  )

  return applyWhiteBackground(cutoutBuffer)
}
