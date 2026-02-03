import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 生成缩略图URL（如果需要）
export function getThumbnailUrl(imageUrl: string, size: number = 300): string {
  // 阿里云OSS支持图片处理参数
  // 例如：https://bucket.oss-cn-hangzhou.aliyuncs.com/image.jpg?x-oss-process=image/resize,w_300
  if (imageUrl.includes('aliyuncs.com')) {
    return `${imageUrl}?x-oss-process=image/resize,w_${size}`
  }
  return imageUrl
}

// 格式化日期
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 颜色标签的中文映射
export const colorMap: Record<string, string> = {
  red: '红色',
  blue: '蓝色',
  green: '绿色',
  yellow: '黄色',
  black: '黑色',
  white: '白色',
  gray: '灰色',
  brown: '棕色',
  pink: '粉色',
  purple: '紫色',
  orange: '橙色',
}

// 类别的中文映射
export const categoryMap: Record<string, string> = {
  top: '上装',
  bottom: '下装',
  outerwear: '外套',
  shoes: '鞋子',
  accessory: '配饰',
}

// 季节的中文映射
export const seasonMap: Record<string, string> = {
  spring: '春季',
  summer: '夏季',
  fall: '秋季',
  winter: '冬季',
  all: '全季',
}

// 风格的中文映射
export const styleMap: Record<string, string> = {
  casual: '休闲',
  formal: '正式',
  sport: '运动',
  elegant: '优雅',
  vintage: '复古',
  street: '街头',
}
