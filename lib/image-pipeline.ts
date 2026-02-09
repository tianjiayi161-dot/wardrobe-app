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

export async function applyWhiteBackground(inputBuffer: Buffer) {
  const trimmed = await sharp(inputBuffer)
    .trim({ threshold: 10 })
    .png()
    .toBuffer()

  const metadata = await sharp(trimmed).metadata()
  const width = metadata.width || 1024
  const height = metadata.height || 1024
  const maxSide = Math.max(width, height)

  const canvas = Math.ceil(maxSide / 0.7)
  const resized = await sharp(trimmed)
    .resize({
      width: Math.round(canvas * 0.7),
      height: Math.round(canvas * 0.7),
      fit: 'inside',
    })
    .png()
    .toBuffer()

  const resizedMeta = await sharp(resized).metadata()
  const left = Math.round((canvas - (resizedMeta.width || 0)) / 2)
  const top = Math.round((canvas - (resizedMeta.height || 0)) / 2)

  const base = sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })

  const out = await base
    .composite([{ input: resized, left, top }])
    .jpeg({ quality: 92 })
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
