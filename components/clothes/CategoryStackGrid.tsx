'use client'

import Link from 'next/link'
import type { Clothing } from '@/types'
import { getThumbnailUrl, categoryMap } from '@/lib/utils'

interface CategoryStackGridProps {
  clothes: Clothing[]
  loading?: boolean
}

const stackOffsets = [
  { x: -6, y: 6, rotate: -3, z: 1 },
  { x: 6, y: -4, rotate: 2, z: 2 },
  { x: 0, y: 0, rotate: 0, z: 3 },
]

export function CategoryStackGrid({ clothes, loading }: CategoryStackGridProps) {
  if (loading) {
    return (
      <div className="px-4 grid grid-cols-2 gap-4 pb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-2xl mb-3" />
            <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto" />
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

  const groups = new Map<string, Clothing[]>()
  for (const item of clothes) {
    const key = item.category || 'other'
    const list = groups.get(key) ?? []
    list.push(item)
    groups.set(key, list)
  }

  const grouped = Array.from(groups.entries())
    .map(([category, items]) => ({
      category,
      label: categoryMap[category] || category,
      items,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))

  return (
    <div className="px-4 grid grid-cols-2 gap-4 pb-6">
      {grouped.map((group) => {
        const previewItems = group.items.slice(0, 3)
        return (
          <Link
            key={group.category}
            href={`/clothes/category/${encodeURIComponent(group.category)}`}
            className="group"
          >
            <div className="relative aspect-square w-28 mx-auto">
              {previewItems.map((item, index) => {
                const offset = stackOffsets[index] ?? stackOffsets[stackOffsets.length - 1]
                return (
                  <div
                    key={item._id}
                    className="absolute inset-0 bg-white border-2 border-black rounded-2xl overflow-hidden"
                      style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.rotate}deg)`,
                        zIndex: offset.z,
                      }}
                    >
                      <img
                        src={getThumbnailUrl(item.imageUrl, 500)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )
                })}

                {previewItems.length === 0 && (
                  <div className="absolute inset-0 bg-white border-2 border-black rounded-2xl" />
                )}

                <div className="absolute top-2 right-2 z-10 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                  {group.items.length}件
                </div>
              </div>

            <div className="mt-3 text-center">
              <p className="text-sm font-semibold text-black">{group.label}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
