'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AIRecommendation, Clothing, Outfit } from '@/types'
import { formatDate } from '@/lib/utils'

type OutfitTab = 'custom' | 'ai'

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loadingOutfits, setLoadingOutfits] = useState(true)
  const [tab, setTab] = useState<OutfitTab>('custom')

  const [clothes, setClothes] = useState<Clothing[]>([])
  const [loadingAI, setLoadingAI] = useState(false)
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [outfitImages, setOutfitImages] = useState<Record<number, string>>({})

  useEffect(() => {
    fetchOutfits()
    fetchClothes()
  }, [])

  const fetchOutfits = async () => {
    try {
      const response = await fetch('/api/outfits')
      const data = await response.json()

      if (data.success) {
        setOutfits(data.outfits)
      }
    } catch (error) {
      console.error('获取搭配列表失败:', error)
    } finally {
      setLoadingOutfits(false)
    }
  }

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

  const deleteOutfit = async (id: string) => {
    if (!confirm('确定要删除这套搭配吗？')) return

    try {
      const response = await fetch(`/api/outfits/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setOutfits(outfits.filter((o) => o._id !== id))
        alert('删除成功')
      } else {
        alert(data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请稍后重试')
    }
  }

  const filteredOutfits = useMemo(() => {
    return outfits.filter((o) => (tab === 'custom' ? !o.isAIGenerated : o.isAIGenerated))
  }, [outfits, tab])

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
    setLoadingAI(true)
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
      setLoadingAI(false)
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
        fetchOutfits()
      } else {
        alert(data.error || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请稍后重试')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">我的搭配</h1>
        <div className="flex gap-3">
          <Link
            href="/outfits/create"
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            自创搭配
          </Link>
          <button
            onClick={() => setTab('ai')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            AI帮我搭
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('custom')}
          className={`px-4 py-2 rounded-md border transition-colors ${
            tab === 'custom'
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          自创搭配
        </button>
        <button
          onClick={() => setTab('ai')}
          className={`px-4 py-2 rounded-md border transition-colors ${
            tab === 'ai'
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          AI帮我搭
        </button>
      </div>

      {tab === 'custom' && (
        <div>
          {loadingOutfits ? (
            <div className="text-center py-12">
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : filteredOutfits.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-4">还没有创建自创搭配</p>
              <Link
                href="/outfits/create"
                className="inline-block px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                创建第一套搭配
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOutfits.map((outfit) => (
                <div
                  key={outfit._id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {outfit.name}
                    </h3>
                  </div>

                  {outfit.description && (
                    <p className="text-sm text-gray-600">{outfit.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs">
                    {outfit.occasion && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {outfit.occasion}
                      </span>
                    )}
                    {outfit.season && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {outfit.season}
                      </span>
                    )}
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {outfit.clothingIds.length} 件衣服
                    </span>
                  </div>

                  <p className="text-xs text-gray-500">
                    创建于 {formatDate(outfit.createdAt)}
                  </p>

                  <div className="flex gap-2 pt-2">
                    <Link
                      href={`/outfits/${outfit._id}`}
                      className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                    >
                      查看详情
                    </Link>
                    <button
                      onClick={() => deleteOutfit(outfit._id)}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-600 text-sm rounded hover:bg-red-100 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'ai' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">AI 推荐搭配</h2>
            <button
              onClick={generateRecommendations}
              disabled={loadingAI}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loadingAI ? '生成中...' : '生成推荐'}
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

          {recommendations.length === 0 && !loadingAI && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">点击"生成推荐"获取 AI 搭配建议</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
