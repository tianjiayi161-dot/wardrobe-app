#!/usr/bin/env node

import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const svgPath = join(__dirname, '..', 'public', 'icon.svg')
const outputDir = join(__dirname, '..', 'public')

async function generateIcons() {
  console.log('正在生成应用图标...')

  try {
    const svgBuffer = readFileSync(svgPath)

    // 生成 192x192 图标
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(join(outputDir, 'icon-192.png'))
    console.log('✓ 已生成 icon-192.png')

    // 生成 512x512 图标
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(join(outputDir, 'icon-512.png'))
    console.log('✓ 已生成 icon-512.png')

    console.log('\n✅ 图标生成完成!')
  } catch (error) {
    console.error('生成图标失败:', error)
    process.exit(1)
  }
}

generateIcons()
