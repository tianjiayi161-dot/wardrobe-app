import OSS from 'ali-oss'

// 检查环境变量
if (!process.env.OSS_ACCESS_KEY_ID ||
    !process.env.OSS_ACCESS_KEY_SECRET ||
    !process.env.OSS_BUCKET_NAME ||
    !process.env.OSS_REGION) {
  console.warn('⚠️  OSS环境变量未配置，请查看.env.local.example')
}

// 创建OSS客户端
export function createOSSClient() {
  return new OSS({
    region: process.env.OSS_REGION!,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
    bucket: process.env.OSS_BUCKET_NAME!,
  })
}

// 上传文件到OSS
export async function uploadToOSS(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const client = createOSSClient()

  // 生成唯一文件名
  const timestamp = Date.now()
  const uniqueFileName = `wardrobe/${timestamp}-${fileName}`

  try {
    const result = await client.put(uniqueFileName, file, {
      headers: {
        'Content-Type': contentType,
      },
    })

    // 返回公网访问URL
    return result.url
  } catch (error) {
    console.error('OSS上传失败:', error)
    throw new Error('图片上传失败')
  }
}

// 删除OSS文件
export async function deleteFromOSS(fileUrl: string): Promise<void> {
  const client = createOSSClient()

  // 从URL中提取文件路径
  const urlObj = new URL(fileUrl)
  const filePath = urlObj.pathname.substring(1) // 去掉开头的'/'

  try {
    await client.delete(filePath)
  } catch (error) {
    console.error('OSS删除失败:', error)
    throw new Error('图片删除失败')
  }
}

// 获取签名URL（用于私有访问）
export async function getSignedUrl(fileUrl: string, expires: number = 3600): Promise<string> {
  const client = createOSSClient()

  const urlObj = new URL(fileUrl)
  const filePath = urlObj.pathname.substring(1)

  try {
    const url = client.signatureUrl(filePath, {
      expires,
    })
    return url
  } catch (error) {
    console.error('生成签名URL失败:', error)
    return fileUrl
  }
}
