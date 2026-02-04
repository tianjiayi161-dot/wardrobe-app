'use client'

// 主页组件
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AIRecommendation, Clothing } from '@/types'

export default function HomePage() {
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [outfitImages, setOutfitImages] = useState<Record<number, string>>({})

  // 加载所有衣服数据
  useEffect(() => {
    fetchClothes()
  }, [])

  const fetchClothes = async () => {
    try {
      const response = await fetch('/api/clothes')
      const data = await response.json()
      if (data.success) {
        setClothes(data.clothes)
      }
    } catch (error) {
      console.error('加载衣服失败:', error)
    }
  }

  // 生成搭配拼接图片
  const generateOutfitImage = async (
    clothingIds: string[],
    outfitIndex: number
  ): Promise<string> => {
    // 获取搭配中的衣服
    const outfitClothes = clothingIds
      .map((id) => clothes.find((c) => c._id === id))
      .filter(Boolean) as Clothing[]

    if (outfitClothes.length === 0) return ''

    // 创建 canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    // 设置画布尺寸（每件衣服120x120，横向排列）
    const itemSize = 120
    const gap = 8
    canvas.width = outfitClothes.length * itemSize + (outfitClothes.length - 1) * gap
    canvas.height = itemSize

    // 加载并绘制所有图片
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })
    }

    try {
      for (let i = 0; i < outfitClothes.length; i++) {
        const img = await loadImage(outfitClothes[i].imageUrl)
        const x = i * (itemSize + gap)

        // 绘制圆角背景
        ctx.fillStyle = '#f3f4f6'
        ctx.beginPath()
        ctx.roundRect(x, 0, itemSize, itemSize, 8)
        ctx.fill()

        // 计算图片缩放以填充正方形（保持宽高比）
        const scale = Math.max(itemSize / img.width, itemSize / img.height)
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale
        const offsetX = x + (itemSize - scaledWidth) / 2
        const offsetY = (itemSize - scaledHeight) / 2

        // 裁剪圆角区域并绘制图片
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(x, 0, itemSize, itemSize, 8)
        ctx.clip()
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight)
        ctx.restore()
      }

      // 转换为 base64
      return canvas.toDataURL('image/png')
    } catch (error) {
      console.error('生成拼接图片失败:', error)
      return ''
    }
  }

  // 生成推荐后生成所有拼接图片
  useEffect(() => {
    if (recommendations.length > 0 && clothes.length > 0) {
      recommendations.forEach(async (rec, index) => {
        const imageUrl = await generateOutfitImage(rec.clothingIds, index)
        setOutfitImages((prev) => ({ ...prev, [index]: imageUrl }))
      })
    }
  }, [recommendations, clothes])

  const generateRecommendations = async () => {
    setLoading(true)
    setOutfitImages({}) // 清空之前的图片
    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 3 }),
      })

      const data = await response.json()

      if (data.success) {
        setRecommendations(data.recommendations)
      } else {
        alert(data.error || '生成推荐失败')
      }
    } catch (error) {
      console.error('生成推荐失败:', error)
      alert('生成推荐失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const saveRecommendation = async (rec: AIRecommendation) => {
    try {
      const response = await fetch('/api/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: rec.outfitName,
          description: rec.description,
          clothingIds: rec.clothingIds,
          occasion: rec.occasion,
          season: rec.season,
          isAIGenerated: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('搭配已保存！')
      } else {
        alert(data.error || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请稍后重试')
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          欢迎来到你的电子衣橱
        </h1>
        <p className="text-lg text-gray-600">
          智能管理你的衣服，AI 帮你搭配
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/clothes/new"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-center"
        >
          <div className="text-3xl mb-2">👕</div>
          <h3 className="font-semibold text-gray-900">添加衣服</h3>
          <p className="text-sm text-gray-600 mt-1">上传照片，AI 自动识别</p>
        </Link>

        <Link
          href="/clothes"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-center"
        >
          <div className="text-3xl mb-2">👚</div>
          <h3 className="font-semibold text-gray-900">浏览衣橱</h3>
          <p className="text-sm text-gray-600 mt-1">查看所有衣服</p>
        </Link>

        <Link
          href="/outfits/create"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-center"
        >
          <div className="text-3xl mb-2">✨</div>
          <h3 className="font-semibold text-gray-900">创建搭配</h3>
          <p className="text-sm text-gray-600 mt-1">手动组合搭配</p>
        </Link>
      </div>

      {/* AI Recommendations */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">AI 推荐搭配</h2>
          <button
            onClick={generateRecommendations}
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '生成中...' : '生成推荐'}
          </button>
        </div>

        {recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* 拼接图片预览 */}
                {outfitImages[index] && (
                  <div className="relative w-full h-32 bg-gray-100 flex items-center justify-center p-2">
                    <img
                      src={outfitImages[index]}
                      alt={rec.outfitName}
                      className="h-full object-contain"
                    />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {rec.outfitName}
                  </h3>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p className="line-clamp-2">💡 {rec.reasoning}</p>
                    {rec.occasion && <p>📍 场合: {rec.occasion}</p>}
                    {rec.season && <p>🌡️ 季节: {rec.season}</p>}
                    <p className="text-gray-400">
                      {rec.clothingIds.length} 件衣服
                    </p>
                  </div>
                  <button
                    onClick={() => saveRecommendation(rec)}
                    className="w-full px-3 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
                  >
                    保存这套搭配
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {recommendations.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">点击"生成推荐"获取 AI 搭配建议</p>
          </div>
        )}
      </div>
    </div>
  )
}
