'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Clothing } from '@/types'
import { categoryMap, getThumbnailUrl } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'

export default function ClothesCategoryPage() {
  const params = useParams()
  const category = decodeURIComponent(params.category as string)
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/clothes?category=${encodeURIComponent(category)}`)
        const data = await res.json()
        if (data.success) {
          setClothes(data.clothes)
        }
      } catch (error) {
        console.error('加载失败:', error)
      } finally {
        setLoading(false)
      }
    }
    if (category) fetchData()
  }, [category])

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title={categoryMap[category] || category} />
      <div className="px-4">
        <Link href="/clothes" className="text-sm text-gray-600 hover:text-gray-900">
          ← 返回衣橱
        </Link>
      </div>

      {loading ? (
        <div className="px-4 py-6 text-sm text-gray-500">正在展开你的单品…</div>
      ) : (
        <div className="px-4 grid grid-cols-2 gap-3 pb-6 mt-4">
          {clothes.map((item) => (
            <Link key={item._id} href={`/clothes/${item._id}`} className="group">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow w-28 mx-auto">
                <div className="aspect-square relative bg-gray-50">
                  <img
                    src={getThumbnailUrl(item.imageUrl, 360)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium text-black truncate">
                    {item.name}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
