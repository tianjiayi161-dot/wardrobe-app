import { applyWhiteBackground } from '@/lib/image-pipeline'
import { uploadToOSS, getSignedUrl } from '@/lib/oss'
import crypto from 'crypto'

export async function removeBackgroundWithAliyun(
  imageBuffer: Buffer,
  mimeType: string
): Promise<Buffer> {
  const endpoint = process.env.ALIYUN_CUTOUT_ENDPOINT
  const appCode = process.env.ALIYUN_CUTOUT_APPCODE
  const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID
  const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET

  if (!endpoint || !appCode) {
    throw new Error('ALIYUN_CUTOUT_ENDPOINT 或 ALIYUN_CUTOUT_APPCODE 未配置')
  }

  const originUrl = await uploadToOSS(
    imageBuffer,
    `cutout-origin-${Date.now()}.jpg`,
    mimeType || 'image/jpeg'
  )
  const signedUrl = await getSignedUrl(originUrl, 3600)

  const baseUrl = endpoint.startsWith('http')
    ? endpoint
    : `https://${endpoint}`

  const params: Record<string, string> = {
    Action: 'SegmentCommonImage',
    Version: '2019-12-30',
    ImageURL: signedUrl,
    ReturnForm: 'whiteBK',
    Format: 'JSON',
  }

  const headers: Record<string, string> = {}
  let url = `${baseUrl}/`

  if (accessKeyId && accessKeySecret) {
    const timestamp = new Date().toISOString()
    const nonce = crypto.randomBytes(16).toString('hex')

    Object.assign(params, {
      AccessKeyId: accessKeyId,
      SignatureMethod: 'HMAC-SHA1',
      SignatureVersion: '1.0',
      SignatureNonce: nonce,
      Timestamp: timestamp,
    })

    const encode = (value: string) =>
      encodeURIComponent(value)
        .replace(/\!/g, '%21')
        .replace(/\'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A')

    const sortedKeys = Object.keys(params).sort()
    const canonicalized = sortedKeys
      .map((key) => `${encode(key)}=${encode(params[key])}`)
      .join('&')

    const stringToSign = `GET&%2F&${encode(canonicalized)}`
    const signature = crypto
      .createHmac('sha1', `${accessKeySecret}&`)
      .update(stringToSign)
      .digest('base64')

    url = `${baseUrl}/?${canonicalized}&Signature=${encode(signature)}`
  } else {
    const search = new URLSearchParams(params).toString()
    url = `${baseUrl}/?${search}`
    headers.Authorization = `APPCODE ${appCode}`
  }

  const res = await fetch(url, {
    method: 'GET',
    headers,
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
