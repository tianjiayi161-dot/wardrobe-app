import { applyWhiteBackground } from '@/lib/image-pipeline'

export async function removeBackgroundWithAliyun(
  imageBuffer: Buffer,
  mimeType: string
): Promise<Buffer> {
  const endpoint = process.env.ALIYUN_CUTOUT_ENDPOINT
  const appCode = process.env.ALIYUN_CUTOUT_APPCODE

  if (!endpoint || !appCode) {
    throw new Error('ALIYUN_CUTOUT_ENDPOINT 或 ALIYUN_CUTOUT_APPCODE 未配置')
  }

  const base64 = imageBuffer.toString('base64')
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `APPCODE ${appCode}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64,
      image_type: 'BASE64',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`阿里云抠图失败: ${res.status} ${text}`)
  }

  const data = await res.json()
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
