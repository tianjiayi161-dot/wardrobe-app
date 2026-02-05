'use client'

import Link from 'next/link'
import type { Clothing } from '@/types'
import { getThumbnailUrl, categoryMap } from '@/lib/utils'

interface ClothesGridProps {
  clothes: Clothing[]
  loading?: boolean
}

export function ClothesGrid({ clothes, loading }: ClothesGridProps) {
  if (loading) {
    return (
      <div className="px-4 grid grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (clothes.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-gray-500 mb-4">没有找到衣服</p>
        <Link
          href="/clothes/new"
          className="inline-block px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
        >
          添加第一件衣服
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 grid grid-cols-2 gap-3 pb-6">
      {clothes.map((item) => (
        <Link
          key={item._id}
          href={`/clothes/${item._id}`}
          className="group"
        >
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            {/* 衣服图片 */}
            <div className="aspect-square relative bg-gray-50">
              <img
                src={getThumbnailUrl(item.imageUrl, 400)}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              {/* 标签 */}
              {item.wearCount === 0 && (
                <div className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded">
                  NEW
                </div>
              )}
              {/* 穿着次数 */}
              {item.wearCount > 0 && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  穿过{item.wearCount}次
                </div>
              )}
            </div>

            {/* 衣服信息 */}
            <div className="p-3">
              <p className="text-sm font-medium text-black truncate group-hover:text-gray-700 transition-colors">
                {item.name}
              </p>
              <p className="text-xs text-gray-500 truncate mt-1">
                {categoryMap[item.category] || item.category}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
