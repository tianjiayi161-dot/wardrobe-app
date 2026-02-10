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

  const candidates: Array<{ label: string; run: () => Promise<Response> }> = [
    { label: 'json:image/base64', run: () => callJson({ image: base64, image_type: 'BASE64' }) },
    { label: 'json:img/base64', run: () => callJson({ img: base64 }) },
    { label: 'form:image/base64', run: () => callForm({ image: base64 }) },
    { label: 'json:image_url', run: () => callJson({ image_url: originUrl }) },
    { label: 'form:image_url', run: () => callForm({ image_url: originUrl }) },
    { label: 'json:image/url', run: () => callJson({ image: originUrl }) },
    { label: 'form:image/url', run: () => callForm({ image: originUrl }) },
    { label: 'json:url', run: () => callJson({ url: originUrl }) },
    { label: 'form:url', run: () => callForm({ url: originUrl }) },
  ]

  let res: Response | null = null
  let data: any = null
  for (const candidate of candidates) {
    res = await candidate.run()
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await res.text()
      throw new Error(`阿里云抠图失败: ${res.status} ${text}`)
    }
    data = await res.json()
    const msg = data?.msg || data?.message || ''
    if (!res.ok || data?.success === false) {
      if (String(msg).includes('图片不能为空') || String(msg).includes('image is empty')) {
        continue
      }
      console.error('[cutout-debug] candidate:', candidate.label)
      console.error('[cutout-debug] response:', JSON.stringify(data).slice(0, 800))
      throw new Error(`阿里云抠图失败: ${res.status} ${JSON.stringify(data)}`)
    }
    break
  }

  if (!data) {
    throw new Error('阿里云抠图失败: 未获得有效响应')
  }

  console.log('[cutout-debug] response:', JSON.stringify(data).slice(0, 800))

  const isBase64 = (value: string) =>
    value.startsWith('data:image') || /^[A-Za-z0-9+/=]+$/.test(value)

  const isUrl = (value: string) => /^https?:\/\//i.test(value)

  const findPayload = (obj: any): { base64?: string; url?: string } => {
    if (!obj || typeof obj !== 'object') return {}
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        if (isUrl(value)) return { url: value }
        if (isBase64(value) && value.length > 200) return { base64: value }
      }
      if (typeof value === 'object') {
        const nested = findPayload(value)
        if (nested.base64 || nested.url) return nested
      }
    }
    return {}
  }

  const payload =
    findPayload({
      data: data?.data,
      result: data?.result,
      image: data?.image,
      output: data?.output,
      response: data,
    }) || {}

  let base64Result = payload.base64 || ''
  const urlResult = payload.url || ''

  if (!base64Result && urlResult) {
    const imageRes = await fetch(urlResult)
    if (!imageRes.ok) {
      const text = await imageRes.text()
      throw new Error(`阿里云抠图结果下载失败: ${imageRes.status} ${text}`)
    }
    const arrayBuffer = await imageRes.arrayBuffer()
    return applyWhiteBackground(Buffer.from(arrayBuffer))
  }

  if (!base64Result) {
    throw new Error('阿里云抠图返回为空')
  }

  const cutoutBuffer = Buffer.from(
    base64Result.replace(/^data:image\/\w+;base64,/, ''),
    'base64'
  )

  return applyWhiteBackground(cutoutBuffer)
}
