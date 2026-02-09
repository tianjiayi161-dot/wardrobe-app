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

  const callApi = async (payload: Record<string, string>) => {
    return fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `APPCODE ${appCode}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  }

  let res = await callApi({
    image: base64,
    image_type: 'BASE64',
    image_url: originUrl,
  })

  const contentType = res.headers.get('content-type') || ''
  let data: any = null
  if (contentType.includes('application/json')) {
    data = await res.json()
  } else {
    const text = await res.text()
    throw new Error(`阿里云抠图失败: ${res.status} ${text}`)
  }

  if (!res.ok || data?.success === false) {
    const msg = data?.msg || data?.message || '阿里云抠图失败'
    if (String(msg).includes('图片不能为空')) {
      res = await callApi({ image_url: originUrl })
      const retryData = await res.json()
      data = retryData
    } else {
      throw new Error(`阿里云抠图失败: ${res.status} ${JSON.stringify(data)}`)
    }
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
