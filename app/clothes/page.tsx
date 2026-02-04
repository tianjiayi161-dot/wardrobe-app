'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Clothing } from '@/types'
import { categoryMap, colorMap } from '@/lib/utils'

const CATEGORY_ORDER: Clothing['category'][] = [
  'tshirt',
  'shirt',
  'knit',
  'sweatshirt',
  'camisole',
  'bottom_pants',
  'bottom_skirt',
  'dress',
  'outerwear',
  'shoes',
  'accessory',
  'set',
  'innerwear',
  'homewear',
  'sportswear',
  'top',
  'bottom',
]

export default function ClothesPage() {
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [loading, setLoading] = useState(true)

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
    } finally {
      setLoading(false)
    }
  }

  const deleteClothing = async (id: string) => {
    if (!confirm('确定要删除这件衣服吗？')) return

    try {
      const response = await fetch(`/api/clothes/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setClothes(clothes.filter((c) => c._id !== id))
        alert('删除成功')
      } else {
        alert(data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请稍后重试')
    }
  }

  const incrementWearCount = async (id: string, current: number) => {
    try {
      const response = await fetch(`/api/clothes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wearCount: current + 1 }),
      })

      const data = await response.json()

      if (data.success) {
        setClothes((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, wearCount: current + 1 } : item
          )
        )
      } else {
        alert(data.error || '更新失败')
      }
    } catch (error) {
      console.error('更新穿着次数失败:', error)
      alert('更新失败，请稍后重试')
    }
  }

  const groupedClothes = useMemo(() => {
    const groups: Record<Clothing['category'], Clothing[]> = {
      tshirt: [],
      shirt: [],
      knit: [],
      sweatshirt: [],
      camisole: [],
      bottom_pants: [],
      bottom_skirt: [],
      dress: [],
      outerwear: [],
      shoes: [],
      accessory: [],
      set: [],
      innerwear: [],
      homewear: [],
      sportswear: [],
      top: [],
      bottom: [],
    }

    for (const item of clothes) {
      groups[item.category].push(item)
    }

    return groups
  }, [clothes])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">我的衣橱</h1>
        <Link
          href="/clothes/new"
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          添加衣服
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : clothes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">还没有添加衣服</p>
          <Link
            href="/clothes/new"
            className="inline-block px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            添加第一件衣服
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {CATEGORY_ORDER.map((category) => {
            const items = groupedClothes[category]
            return (
              <section key={category} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {categoryMap[category]}
                    </h2>
                    <span className="text-xs text-gray-500">
                      {items.length} 件
                    </span>
                  </div>
                  <Link
                    href={`/clothes/new?category=${category}`}
                    className="text-sm px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    添加{categoryMap[category]}
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <Link
                    href={`/clothes/new?category=${category}`}
                    className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors min-h-[140px]"
                  >
                    <div className="text-2xl">＋</div>
                    <div className="text-sm mt-2">添加{categoryMap[category]}</div>
                  </Link>

                  {items.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-center text-sm text-gray-500">
                      暂无{categoryMap[category]}，可以先添加一件。
                    </div>
                  ) : (
                    items.map((clothing) => (
                      <div
                        key={clothing._id}
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="relative aspect-square">
                          <Image
                            src={clothing.thumbnail}
                            alt={clothing.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-3 space-y-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {clothing.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {categoryMap[clothing.category]}
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {clothing.colors.map((color) => (
                              <span
                                key={color}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                              >
                                {colorMap[color] || color}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Link
                              href={`/clothes/${clothing._id}`}
                              className="flex-1 text-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                            >
                              查看
                            </Link>
                            <button
                              onClick={() => deleteClothing(clothing._id)}
                              className="flex-1 px-3 py-1 bg-red-50 text-red-600 text-sm rounded hover:bg-red-100 transition-colors"
                            >
                              删除
                            </button>
                          </div>
                          <div className="flex items-center justify-between pt-2 text-xs text-gray-600">
                            <span>穿着次数：{clothing.wearCount || 0}</span>
                            <button
                              onClick={() =>
                                incrementWearCount(
                                  clothing._id,
                                  clothing.wearCount || 0
                                )
                              }
                              className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
