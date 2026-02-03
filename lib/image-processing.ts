import sharp from 'sharp'

/**
 * 图片预处理：优化图片以提升AI识别准确度
 */
export async function preprocessImageForAI(
  imageBuffer: Buffer
): Promise<{ processedBuffer: Buffer; metadata: any }> {
  try {
    const image = sharp(imageBuffer)
    const metadata = await image.metadata()

    // 调整大小（Gemini最佳尺寸：1024-2048px）
    let processed = image.resize(1536, 1536, {
      fit: 'inside',
      withoutEnlargement: true,
    })

    // 自动调整方向（处理EXIF旋转）
    processed = processed.rotate()

    // 轻微锐化（提升边缘识别）
    processed = processed.sharpen({ sigma: 0.5 })

    // 规范化颜色空间
    processed = processed.toColorspace('srgb')

    // 转换为JPEG（压缩但保持质量）
    const processedBuffer = await processed
      .jpeg({ quality: 92, progressive: true })
      .toBuffer()

    return { processedBuffer, metadata }
  } catch (error) {
    console.error('图片预处理失败:', error)
    return { processedBuffer: imageBuffer, metadata: {} }
  }
}

/**
 * 分析图片质量并提供改进建议
 */
export async function analyzeImageQuality(imageBuffer: Buffer): Promise<{
  isBlurry: boolean
  isTooSmall: boolean
  hasGoodLighting: boolean
  warnings: string[]
}> {
  try {
    const image = sharp(imageBuffer)
    const metadata = await image.metadata()
    const warnings: string[] = []

    // 尺寸检查
    const isTooSmall = (metadata.width || 0) < 300 || (metadata.height || 0) < 300
    if (isTooSmall) {
      warnings.push('图片尺寸较小，可能影响识别准确度')
    }

    // 统计分析（检测光照）
    const stats = await image.stats()
    const avgBrightness = stats.channels.reduce((sum, ch) => sum + ch.mean, 0) / stats.channels.length
    const hasGoodLighting = avgBrightness > 30 && avgBrightness < 230

    if (!hasGoodLighting) {
      if (avgBrightness <= 30) warnings.push('图片过暗，建议在光线充足环境拍摄')
      if (avgBrightness >= 230) warnings.push('图片过亮，可能曝光过度')
    }

    // 模糊检测（简化版）
    const { data, info } = await image
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const isBlurry = estimateBlur(data, info.width, info.height) < 100
    if (isBlurry) {
      warnings.push('图片可能模糊，建议重新拍摄')
    }

    return { isBlurry, isTooSmall, hasGoodLighting, warnings }
  } catch (error) {
    console.error('图片质量分析失败:', error)
    return {
      isBlurry: false,
      isTooSmall: false,
      hasGoodLighting: true,
      warnings: [],
    }
  }
}

/**
 * 简单的Laplacian方差计算（用于模糊检测）
 */
function estimateBlur(pixels: Buffer, width: number, height: number): number {
  let sum = 0
  let count = 0

  for (let y = 1; y < Math.min(height - 1, 100); y++) {
    for (let x = 1; x < Math.min(width - 1, 100); x++) {
      const idx = y * width + x
      const laplacian =
        -pixels[idx - width - 1] - pixels[idx - width] - pixels[idx - width + 1] +
        -pixels[idx - 1] + 8 * pixels[idx] - pixels[idx + 1] +
        -pixels[idx + width - 1] - pixels[idx + width] - pixels[idx + width + 1]

      sum += laplacian * laplacian
      count++
    }
  }

  return count > 0 ? sum / count : 100
}
