import sharp from 'sharp'

const DEFAULT_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1'

function getWanxApiKey() {
  return process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY || ''
}

function getWanxBaseUrl() {
  return process.env.WANX_BASE_URL || DEFAULT_BASE_URL
}

export async function generateWanxImage(prompt: string): Promise<string> {
  const apiKey = getWanxApiKey()
  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY 或 QWEN_API_KEY 未配置')
  }

  const createUrl = `${getWanxBaseUrl()}/services/aigc/text2image/image-synthesis`
  const response = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model: 'wan2.2-t2i-flash',
      input: {
        prompt,
      },
      parameters: {
        size: '1280*1280',
        n: 1,
        prompt_extend: false,
        watermark: false,
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`万相生成任务创建失败: ${response.status} ${text}`)
  }

  const data = await response.json()
  const taskId = data?.output?.task_id
  if (!taskId) {
    throw new Error('万相未返回任务ID')
  }

  const taskUrl = `${getWanxBaseUrl()}/tasks/${taskId}`
  const maxAttempts = 40
  for (let i = 0; i < maxAttempts; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const taskRes = await fetch(taskUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!taskRes.ok) {
      const text = await taskRes.text()
      throw new Error(`万相查询失败: ${taskRes.status} ${text}`)
    }
    const taskData = await taskRes.json()
    const status = taskData?.output?.task_status
    if (status === 'SUCCEEDED') {
      const imageUrl =
        taskData?.output?.results?.[0]?.url ||
        taskData?.output?.results?.[0]?.image ||
        ''
      if (!imageUrl) {
        throw new Error('万相未返回图片地址')
      }
      return imageUrl
    }
    if (status === 'FAILED') {
      throw new Error(taskData?.output?.message || '万相生成失败')
    }
  }

  throw new Error('万相生成超时，请稍后重试')
}

export async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`图片下载失败: ${res.status} ${text}`)
  }
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function addBrandWatermark(
  inputBuffer: Buffer,
  text: string = '衣序 AI'
): Promise<Buffer> {
  const image = sharp(inputBuffer)
  const metadata = await image.metadata()
  const width = metadata.width || 1024
  const height = metadata.height || 1024
  const fontSize = Math.max(22, Math.round(width * 0.03))
  const padding = Math.round(width * 0.04)

  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .label { fill: rgba(0,0,0,0.35); font-size: ${fontSize}px; font-family: "Noto Sans SC","PingFang SC","Helvetica","Arial",sans-serif; font-weight: 600; }
      </style>
      <text x="${width - padding}" y="${height - padding}" text-anchor="end" class="label">${text}</text>
    </svg>`
  )

  return image
    .composite([{ input: svg, top: 0, left: 0 }])
    .png()
    .toBuffer()
}
