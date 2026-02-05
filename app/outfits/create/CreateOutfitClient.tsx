'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Clothing, AIRecommendation } from '@/types'
import { categoryMap, getThumbnailUrl } from '@/lib/utils'

const TOP_CATEGORIES: Clothing['category'][] = [
  'tshirt',
  'shirt',
  'knit',
  'sweatshirt',
  'camisole',
]

const REQUIRED_CATEGORIES: Clothing['category'][] = [
  ...TOP_CATEGORIES,
  'bottom_pants',
  'bottom_skirt',
  'shoes',
  'accessory',
]

const FULL_OUTFIT_CATEGORIES: Clothing['category'][] = [
  'dress',
  'set',
  'sportswear',
  'homewear',
]

export default function CreateOutfitClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMode = searchParams.get('ai') === 'true' ? 'ai' : 'manual'
  const [loading, setLoading] = useState(false)
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [selectedClothingIds, setSelectedClothingIds] = useState<string[]>([])
  const [mode, setMode] = useState<'manual' | 'ai'>(initialMode)
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [selectedRecommendation, setSelectedRecommendation] = useState<AIRecommendation | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    occasion: '',
    season: '',
  })

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
      console.error('获取衣服列表失败:', error)
    }
  }

  const toggleClothing = (id: string) => {
    setSelectedClothingIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    )
  }

  const missingCategories = useMemo(() => {
    const available = REQUIRED_CATEGORIES.filter((cat) =>
      clothes.some((c) => c.category === cat)
    )
    const selectedCategories = selectedClothingIds
      .map((id) => clothes.find((c) => c._id === id)?.category)
      .filter(Boolean) as Clothing['category'][]

    const selected = new Set(selectedCategories)
    const hasFullOutfit = FULL_OUTFIT_CATEGORIES.some((cat) => selected.has(cat))
    const hasTop = TOP_CATEGORIES.some((cat) => selected.has(cat))
    const hasBottom =
      selected.has('bottom_pants') ||
      selected.has('bottom_skirt')

    const missing: Clothing['category'][] = []

    if (!hasFullOutfit) {
      if (!hasTop) {
        const availableTop = TOP_CATEGORIES.find((cat) => available.includes(cat))
        if (availableTop) missing.push(availableTop)
      }
      if (!hasBottom) {
        if (available.includes('bottom_pants')) {
          missing.push('bottom_pants')
        } else if (available.includes('bottom_skirt')) {
          missing.push('bottom_skirt')
        }
      }
    }

    if (available.includes('shoes') && !selected.has('shoes')) missing.push('shoes')
    if (available.includes('accessory') && !selected.has('accessory')) missing.push('accessory')

    return missing
  }, [clothes, selectedClothingIds])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'ai') {
      if (!selectedRecommendation) {
        alert('请先生成并选择一套AI搭配')
        return
      }
      if (!formData.name.trim()) {
        alert('请填写搭配名称')
        return
      }
    } else {
      if (selectedClothingIds.length === 0) {
        alert('请至少选择一件衣服')
        return
      }

      if (missingCategories.length > 0) {
        alert(`请补齐以下品类：${missingCategories.map((c) => categoryMap[c]).join('、')}`)
        return
      }
    }

    setLoading(true)

    try {
      const payload =
        mode === 'ai'
          ? {
              ...formData,
              name: formData.name.trim(),
              description: formData.description || selectedRecommendation?.description || '',
              occasion: formData.occasion || selectedRecommendation?.occasion || '',
              season: formData.season || selectedRecommendation?.season || '',
              clothingIds: selectedRecommendation?.clothingIds || [],
              isAIGenerated: true,
            }
          : {
              ...formData,
              clothingIds: selectedClothingIds,
              isAIGenerated: false,
            }

      const response = await fetch('/api/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        alert('创建成功！')
        router.push('/outfits')
      } else {
        alert(data.error || '创建失败')
      }
    } catch (error) {
      console.error('创建失败:', error)
      alert('创建失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">创建搭配</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              mode === 'manual'
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            自己搭配
          </button>
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              mode === 'ai'
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            AI搭配
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'ai' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">AI 生成搭配</h2>
              <button
                type="button"
                onClick={async () => {
                  setAiLoading(true)
                  try {
                    const res = await fetch('/api/recommend', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ count: 4 }),
                    })
                    const data = await res.json()
                    if (data.success) {
                      setRecommendations(data.recommendations)
                      const first = data.recommendations[0]
                      setSelectedRecommendation(first || null)
                      if (first) {
                        setFormData((prev) => ({
                          ...prev,
                          name: prev.name || first.outfitName || '',
                          description: prev.description || first.description || '',
                          occasion: prev.occasion || first.occasion || '',
                          season: prev.season || first.season || '',
                        }))
                      }
                    } else {
                      alert(data.error || '生成失败')
                    }
                  } catch (error) {
                    console.error('生成失败:', error)
                    alert('生成失败，请稍后重试')
                  } finally {
                    setAiLoading(false)
                  }
                }}
                className="px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                disabled={aiLoading}
              >
                {aiLoading ? '生成中...' : '生成搭配'}
              </button>
            </div>

            {recommendations.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {recommendations.map((rec, idx) => {
                  const isSelected = selectedRecommendation === rec
                  return (
                    <button
                      type="button"
                      key={`${rec.outfitName}-${idx}`}
                      onClick={() => {
                        setSelectedRecommendation(rec)
                        setFormData((prev) => ({
                          ...prev,
                          name: rec.outfitName || prev.name,
                          description: rec.description || prev.description,
                          occasion: rec.occasion || prev.occasion,
                          season: rec.season || prev.season,
                        }))
                      }}
                      className={`text-left border rounded-lg p-2 transition-colors ${
                        isSelected ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-square bg-gray-50 rounded-md p-1">
                        <div className="grid grid-cols-2 gap-1 h-full">
                          {rec.clothingIds.slice(0, 4).map((id) => {
                            const item = clothes.find((c) => c._id === id)
                            if (!item) return null
                            return (
                              <div key={id} className="relative bg-white rounded overflow-hidden">
                                <img
                                  src={getThumbnailUrl(item.imageUrl, 200)}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {rec.outfitName || 'AI搭配'}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 基本信息 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">基本信息</h2>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              搭配名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">
                适合场合
              </label>
              <input
                type="text"
                value={formData.occasion}
                onChange={(e) =>
                  setFormData({ ...formData, occasion: e.target.value })
                }
                placeholder="如：休闲、正式、运动"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">
                适合季节
              </label>
              <select
                value={formData.season}
                onChange={(e) =>
                  setFormData({ ...formData, season: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">不限</option>
                <option value="spring">春季</option>
                <option value="summer">夏季</option>
                <option value="fall">秋季</option>
                <option value="winter">冬季</option>
              </select>
            </div>
          </div>
        </div>

        {/* 选择衣服 */}
        {mode === 'manual' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-xl font-semibold text-gray-900">
              选择衣服 ({selectedClothingIds.length} 件已选)
            </h2>
            {missingCategories.length > 0 && (
              <span className="text-sm text-red-500">
                还缺：{missingCategories.map((c) => categoryMap[c]).join('、')}
              </span>
            )}
          </div>

          {clothes.length === 0 ? (
            <p className="text-gray-500">
              还没有衣服，请先<a href="/clothes/new" className="text-blue-600 hover:underline">添加衣服</a>
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {clothes.map((clothing) => (
                <div
                  key={clothing._id}
                  onClick={() => toggleClothing(clothing._id)}
                  className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
                    selectedClothingIds.includes(clothing._id)
                      ? 'border-black shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="relative aspect-square">
                    <Image
                      src={clothing.thumbnail}
                      alt={clothing.name}
                      fill
                      className="object-cover"
                    />
                    {selectedClothingIds.includes(clothing._id) && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-sm">
                        ✓
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {clothing.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {categoryMap[clothing.category]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* 提交按钮 */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading || selectedClothingIds.length === 0 || missingCategories.length > 0}
            className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '创建中...' : '创建搭配'}
          </button>
        </div>
      </form>
    </div>
  )
}
