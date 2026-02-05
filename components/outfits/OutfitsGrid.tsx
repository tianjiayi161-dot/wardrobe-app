'use client'

import Link from 'next/link'
import type { Outfit, Clothing } from '@/types'
import { getThumbnailUrl } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

interface OutfitsGridProps {
  outfits: Outfit[]
  clothes: Clothing[]
  loading?: boolean
}

export function OutfitsGrid({ outfits, clothes, loading }: OutfitsGridProps) {
  // 创建衣服ID到衣服对象的映射
  const clothesMap = new Map(clothes.map((c) => [c._id, c]))

  if (loading) {
    return (
      <div className="px-4 grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (outfits.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-gray-500 mb-4">还没有搭配</p>
        <Link
          href="/outfits/create"
          className="inline-block px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
        >
          创建第一个搭配
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 grid grid-cols-2 gap-3 pb-6">
      {outfits.map((outfit) => {
        // 获取搭配中的衣服
        const outfitClothes = outfit.clothingIds
          .map((id) => clothesMap.get(id))
          .filter((c): c is Clothing => c !== undefined)
          .slice(0, 4)

        return (
          <Link
            key={outfit._id}
            href={`/outfits/${outfit._id}`}
            className="group"
          >
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow w-28 mx-auto">
              {/* 搭配预览图 */}
              <div className="aspect-square bg-gray-50 p-1">
                {outfitClothes.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1 h-full">
                    {outfitClothes.map((item, index) => (
                      <div
                        key={index}
                        className="relative bg-white rounded-lg overflow-hidden ring-1 ring-black/5"
                      >
                        <img
                          src={getThumbnailUrl(item.imageUrl, 360)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p className="text-xs">暂无图片</p>
                  </div>
                )}

                {/* AI标记 */}
                {outfit.isAIGenerated && (
                  <div className="absolute top-3 left-3 bg-black text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Sparkles size={12} />
                    AI
                  </div>
                )}
              </div>

              {/* 搭配信息 */}
              <div className="p-2">
                <p className="text-sm font-medium text-black truncate group-hover:text-gray-700 transition-colors">
                  {outfit.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {outfit.clothingIds.length}件衣服
                </p>
                {outfit.tags && outfit.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {outfit.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
