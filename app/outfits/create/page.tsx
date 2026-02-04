'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Clothing } from '@/types'
import { categoryMap } from '@/lib/utils'

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

export default function CreateOutfitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [selectedClothingIds, setSelectedClothingIds] = useState<string[]>([])

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

    if (selectedClothingIds.length === 0) {
      alert('请至少选择一件衣服')
      return
    }

    if (missingCategories.length > 0) {
      alert(`请补齐以下品类：${missingCategories.map((c) => categoryMap[c]).join('、')}`)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          clothingIds: selectedClothingIds,
          isAIGenerated: false,
        }),
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
      <h1 className="text-3xl font-bold text-gray-900">创建搭配</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
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
