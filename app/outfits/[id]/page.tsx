'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Outfit, Clothing } from '@/types'
import { categoryMap, formatDate } from '@/lib/utils'

export default function OutfitDetailPage() {
  const params = useParams()
  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchOutfitDetail(params.id as string)
    }
  }, [params.id])

  const fetchOutfitDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/outfits/${id}`)
      const data = await response.json()

      if (data.success) {
        setOutfit(data.outfit)
        setClothes(data.clothes)
      } else {
        alert(data.error || '获取搭配详情失败')
      }
    } catch (error) {
      console.error('获取搭配详情失败:', error)
      alert('获取搭配详情失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  if (!outfit) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">搭配不存在</p>
        <Link href="/outfits" className="text-blue-600 hover:underline">
          返回搭配列表
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Link
          href="/outfits"
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← 返回搭配列表
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
        {/* 标题和标签 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{outfit.name}</h1>
            {outfit.isAIGenerated && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                AI推荐
              </span>
            )}
          </div>

          {outfit.description && (
            <p className="text-gray-600">{outfit.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {outfit.occasion && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                场合: {outfit.occasion}
              </span>
            )}
            {outfit.season && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                季节: {outfit.season}
              </span>
            )}
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
              创建于 {formatDate(outfit.createdAt)}
            </span>
          </div>
        </div>

        {/* 衣服展示 */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">
            包含的衣服 ({clothes.length} 件)
          </h2>

          {clothes.length === 0 ? (
            <p className="text-gray-500">没有找到相关衣服</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {clothes.map((clothing) => (
                <Link
                  key={clothing._id}
                  href={`/clothes/${clothing._id}`}
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
                  <div className="p-3 space-y-1">
                    <p className="font-medium text-gray-900 truncate">
                      {clothing.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {categoryMap[clothing.category]}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
