import sharp from 'sharp'
import { analyzeClothingAttributes } from '@/lib/qwen'

export type ClothingAttributeLabels = {
  category: string
  subcategory: string
  colorsHex: string[]
  material: string
  colors: string[]
  style: string[]
  season: string[]
  description: string
}

export async function applyWhiteBackgroundAndShadow(inputBuffer: Buffer) {
  const image = sharp(inputBuffer)
  const metadata = await image.metadata()
  const width = metadata.width || 1024
  const height = metadata.height || 1024
  const maxSide = Math.max(width, height)
  const canvas = Math.ceil(maxSide / 0.8)

  const resized = await image
    .resize({
      width: Math.round(canvas * 0.8),
      height: Math.round(canvas * 0.8),
      fit: 'inside',
    })
    .png()
    .toBuffer()

  const shadow = await sharp(resized)
    .ensureAlpha()
    .blur(12)
    .tint({ r: 0, g: 0, b: 0 })
    .toBuffer()

  const base = sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })

  const left = Math.round((canvas - (await sharp(resized).metadata()).width!) / 2)
  const top = Math.round((canvas - (await sharp(resized).metadata()).height!) / 2)

  const shadowLeft = left + Math.round(canvas * 0.02)
  const shadowTop = top + Math.round(canvas * 0.03)

  const out = await base
    .composite([
      { input: shadow, left: shadowLeft, top: shadowTop, blend: 'over', opacity: 0.18 },
      { input: resized, left, top },
    ])
    .png()
    .toBuffer()

  return out
}

export async function extractAttributesFromImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<ClothingAttributeLabels> {
  const base64 = imageBuffer.toString('base64')
  return analyzeClothingAttributes(base64, mimeType)
}
