'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AIRecommendation, Clothing } from '@/types'
import { categoryMap } from '@/lib/utils'

const CATEGORY_ORDER: Clothing['category'][] = [
  'top',
  'bottom',
  'outerwear',
  'shoes',
  'accessory',
]

export default function HomePage() {
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [outfitImages, setOutfitImages] = useState<Record<number, string>>({})

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

  const categoryCounts = useMemo(() => {
    const counts: Record<Clothing['category'], number> = {
      top: 0,
      bottom: 0,
      outerwear: 0,
      shoes: 0,
      accessory: 0,
    }
    clothes.forEach((item) => {
      counts[item.category] += 1
    })
    return counts
  }, [clothes])

  const generateOutfitImage = async (
    clothingIds: string[],
    outfitIndex: number
  ): Promise<string> => {
    const outfitClothes = clothingIds
      .map((id) => clothes.find((c) => c._id === id))
      .filter(Boolean) as Clothing[]

    if (outfitClothes.length === 0) return ''

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    const itemSize = 120
    const gap = 8
    canvas.width = outfitClothes.length * itemSize + (outfitClothes.length - 1) * gap
    canvas.height = itemSize

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

        ctx.fillStyle = '#f3f4f6'
        ctx.beginPath()
        ctx.roundRect(x, 0, itemSize, itemSize, 8)
        ctx.fill()

        const scale = Math.max(itemSize / img.width, itemSize / img.height)
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale
        const offsetX = x + (itemSize - scaledWidth) / 2
        const offsetY = (itemSize - scaledHeight) / 2

        ctx.save()
        ctx.beginPath()
        ctx.roundRect(x, 0, itemSize, itemSize, 8)
        ctx.clip()
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight)
        ctx.restore()
      }

      return canvas.toDataURL('image/png')
    } catch (error) {
      console.error('生成拼接图片失败:', error)
      return ''
    }
  }

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
    setOutfitImages({})
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
    <div className="space-y-10">
      <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">我的衣橱</h1>
            <p className="text-sm text-gray-600 mt-1">分类管理与快速新增</p>
          </div>
          <Link
            href="/clothes"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            进入衣橱
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {CATEGORY_ORDER.map((category) => (
            <div
              key={category}
              className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {categoryMap[category]}
                </span>
                <span className="text-xs text-gray-500">
                  {categoryCounts[category]} 件
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/clothes/new?category=${category}`}
                  className="flex-1 text-center px-2 py-1 text-xs bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  添加
                </Link>
                <Link
                  href="/clothes"
                  className="flex-1 text-center px-2 py-1 text-xs border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  查看
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">我的搭配</h2>
            <p className="text-sm text-gray-600 mt-1">自创搭配 + AI 帮你搭</p>
          </div>
          <Link
            href="/outfits"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            查看搭配
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-5 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">自创搭配</h3>
            <p className="text-sm text-gray-600">手动挑选，打造自己的搭配风格。</p>
            <div className="flex gap-2">
              <Link
                href="/outfits/create"
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                开始创建
              </Link>
              <Link
                href="/outfits"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                查看列表
              </Link>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-5 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">AI 帮我搭</h3>
            <p className="text-sm text-gray-600">快速生成完整搭配，支持一键保存。</p>
            <div className="flex gap-2">
              <button
                onClick={generateRecommendations}
                disabled={loading}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '生成中...' : '生成推荐'}
              </button>
              <Link
                href="/outfits"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                已保存搭配
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="ai" className="space-y-4">
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
                    <p className="text-gray-400">{rec.clothingIds.length} 件衣服</p>
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
      </section>
    </div>
  )
}
