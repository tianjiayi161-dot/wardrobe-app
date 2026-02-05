'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import type { Outfit, Clothing } from '@/types'
import { getThumbnailUrl } from '@/lib/utils'

export function TodaysFocus() {
  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [outfitClothes, setOutfitClothes] = useState<Clothing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTodayOutfit = async () => {
      try {
        const [outfitsRes, clothesRes] = await Promise.all([
          fetch('/api/outfits'),
          fetch('/api/clothes')
        ])

        if (outfitsRes.ok && clothesRes.ok) {
          const outfitsData = await outfitsRes.json()
          const clothesData = await clothesRes.json()
          const outfits = outfitsData.outfits ?? []
          const allClothes = clothesData.clothes ?? []

          // 随机选择一个搭配作为今日推荐
          if (outfits.length > 0) {
            const randomIndex = Math.floor(Math.random() * outfits.length)
            const selectedOutfit = outfits[randomIndex]
            setOutfit(selectedOutfit)

            // 根据clothingIds筛选衣服
            const clothesMap = new Map(allClothes.map((c: Clothing) => [c._id, c]))
            const clothes = selectedOutfit.clothingIds
              .map((id: string) => clothesMap.get(id))
              .filter((c: Clothing | undefined): c is Clothing => c !== undefined)
            setOutfitClothes(clothes)
          }
        }
      } catch (error) {
        console.error('Failed to fetch outfit:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTodayOutfit()
  }, [])

  if (loading) {
    return (
      <div className="px-4 pb-4">
        <h2 className="text-lg font-semibold text-black mb-3">穿搭灵感集</h2>
        <Card className="p-4">
          <div className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </Card>
      </div>
    )
  }

  if (!outfit) {
    return (
      <div className="px-4 pb-4">
        <h2 className="text-lg font-semibold text-black mb-3">穿搭灵感集</h2>
        <Card className="p-6 text-center">
          <p className="text-gray-500 mb-4">还没有搭配</p>
          <Link
            href="/outfits"
            className="inline-block px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            创建搭配
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 pb-4">
      <h2 className="text-lg font-semibold text-black mb-3">穿搭灵感集</h2>
      <Link href={`/outfits/${outfit._id}`}>
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
          {/* 搭配预览图（与最近收藏同尺寸） */}
          {outfitClothes.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 px-3 pt-3">
              {outfitClothes.slice(0, 5).map((item, index) => (
                <div key={index} className="flex-shrink-0 w-28">
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="aspect-square relative bg-gray-50">
                      <img
                        src={getThumbnailUrl(item.imageUrl, 360)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-28 text-gray-400">
              <p>暂无图片</p>
            </div>
          )}

          {/* 搭配信息 */}
          <div className="p-4 pt-2">
            <h3 className="font-semibold text-black mb-1">{outfit.name}</h3>
            {outfit.tags && outfit.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {outfit.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>
      </Link>
    </div>
  )
}
