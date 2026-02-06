'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Clothing } from '@/types'
import { categoryMap, colorMap, seasonMap, styleMap } from '@/lib/utils'

export default function ClothingDetailPage() {
  const params = useParams()
  const [clothing, setClothing] = useState<Clothing | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchClothing(params.id as string)
    }
  }, [params.id])

  const fetchClothing = async (id: string) => {
    try {
      const response = await fetch(`/api/clothes/${id}`)
      const data = await response.json()
      if (data.success) {
        setClothing(data.clothing)
      } else {
        alert(data.error || '获取衣服详情失败')
      }
    } catch (error) {
      console.error('获取衣服详情失败:', error)
      alert('获取衣服详情失败')
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

  if (!clothing) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">衣服不存在</p>
        <Link href="/clothes" className="text-blue-600 hover:underline">
          返回衣橱
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Link
          href="/clothes"
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← 返回衣橱
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-50">
          <Image
            src={clothing.imageUrl}
            alt={clothing.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">{clothing.name}</h1>
          <p className="text-sm text-gray-600">
            {categoryMap[clothing.category] || clothing.category}
          </p>
          <p className="text-sm text-gray-500">
            穿着次数：{clothing.wearCount} 次
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="text-gray-500">颜色</div>
            <div className="text-gray-900">
              {(clothing.colors || []).map((c) => colorMap[c] || c).join(' / ') || '—'}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-gray-500">季节</div>
            <div className="text-gray-900">
              {(clothing.season || []).map((s) => seasonMap[s] || s).join(' / ') || '—'}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-gray-500">风格</div>
            <div className="text-gray-900">
              {(clothing.style || []).map((s) => styleMap[s] || s).join(' / ') || '—'}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-gray-500">品牌</div>
            <div className="text-gray-900">{clothing.brand || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
