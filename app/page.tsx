'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Clothing, Outfit } from '@/types'
import { categoryMap, formatDate } from '@/lib/utils'

export default function HomePage() {
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clothesRes, outfitsRes] = await Promise.all([
          fetch('/api/clothes'),
          fetch('/api/outfits'),
        ])
        const clothesData = await clothesRes.json()
        const outfitsData = await outfitsRes.json()

        if (clothesData.success) setClothes(clothesData.clothes)
        if (outfitsData.success) setOutfits(outfitsData.outfits)
      } catch (error) {
        console.error('加载主页数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const clothingMap = useMemo(() => {
    const map = new Map<string, Clothing>()
    clothes.forEach((item) => map.set(item._id, item))
    return map
  }, [clothes])

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">电子衣橱</h1>
          <p className="text-sm text-gray-600 mt-1">
            按时间顺序展示最近添加的衣服和搭配。
          </p>
        </div>
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">我的衣橱</h2>
              <Link
                href="/clothes"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                查看全部
              </Link>
            </div>
            {clothes.length === 0 ? (
              <p className="text-sm text-gray-500">还没有添加衣服</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {clothes.slice(0, 6).map((item) => (
                  <div key={item._id} className="space-y-2">
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                      <Image
                        src={item.thumbnail}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {categoryMap[item.category] || item.category}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">我的搭配</h2>
              <Link
                href="/outfits"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                查看全部
              </Link>
            </div>
            {outfits.length === 0 ? (
              <p className="text-sm text-gray-500">还没有创建搭配</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {outfits.slice(0, 6).map((item) => {
                  const images = item.clothingIds
                    .map((id) => clothingMap.get(id)?.thumbnail)
                    .filter(Boolean)
                    .slice(0, 3) as string[]

                  return (
                    <div key={item._id} className="space-y-2">
                      <div className="grid grid-cols-3 gap-1">
                        {images.length > 0 ? (
                          images.map((src, index) => (
                            <div
                              key={index}
                              className="relative aspect-square rounded-md overflow-hidden border border-gray-200 bg-gray-50"
                            >
                              <Image src={src} alt={item.name} fill className="object-cover" />
                            </div>
                          ))
                        ) : (
                          <div className="col-span-3 aspect-square rounded-md border border-gray-200 bg-gray-50" />
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.clothingIds.length} 件衣服
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
