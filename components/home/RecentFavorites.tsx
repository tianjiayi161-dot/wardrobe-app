'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Clothing } from '@/types'
import { getThumbnailUrl, categoryMap } from '@/lib/utils'

export function RecentFavorites() {
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentClothes = async () => {
      try {
        const response = await fetch('/api/clothes')
        if (response.ok) {
          const data = await response.json()
          // 获取最近添加的5件衣服
          const recent = (data.clothes ?? []).slice(0, 5)
          setClothes(recent)
        }
      } catch (error) {
        console.error('Failed to fetch clothes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentClothes()
  }, [])

  if (loading) {
    return (
      <div className="px-4 pb-4">
        <h2 className="text-lg font-semibold text-black mb-3">最近收藏</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-32">
              <div className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (clothes.length === 0) {
    return (
      <div className="px-4 pb-4">
        <h2 className="text-lg font-semibold text-black mb-3">最近收藏</h2>
        <div className="p-6 text-center bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-4">衣橱还是空的</p>
          <Link
            href="/clothes/new"
            className="inline-block px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            添加第一件衣服
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pb-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-black">最近收藏</h2>
        <Link href="/clothes" className="text-sm text-gray-600 hover:text-black">
          查看全部 →
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
        {clothes.map((item) => (
          <Link
            key={item._id}
            href={`/clothes/${item._id}`}
            className="flex-shrink-0 w-32"
          >
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square relative bg-gray-50">
                <img
                  src={getThumbnailUrl(item.imageUrl, 300)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {/* 标签 */}
                {item.wearCount === 0 && (
                  <div className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded">
                    NEW
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-sm font-medium text-black truncate">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {categoryMap[item.category] || item.category}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
