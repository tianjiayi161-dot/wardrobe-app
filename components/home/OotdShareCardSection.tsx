'use client'

import { useEffect, useMemo, useState } from 'react'
import { OotdShareCard } from '@/components/ootd/OotdShareCard'

type ClothingItem = {
  _id: string
  imageUrl: string
  name?: string
}

const formatDateLabel = (date: Date) => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const day = String(date.getDate()).padStart(2, '0')
  const month = months[date.getMonth()]
  return `${day} ${month}`
}

export function OotdShareCardSection() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch('/api/clothes')
        const data = await res.json()
        if (data.success) {
          setItems((data.clothes || []).slice(0, 3))
        }
      } catch (error) {
        console.error('获取衣服失败:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  const cardItems = useMemo(
    () =>
      items.map((item) => ({
        id: item._id,
        imageUrl: item.imageUrl,
        alt: item.name || 'ootd item',
      })),
    [items]
  )

  return (
    <div className="px-4 pb-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">今日穿搭分享</h3>
        {loading && <span className="text-xs text-gray-400">加载中...</span>}
      </div>
      <OotdShareCard dateLabel={formatDateLabel(new Date())} items={cardItems} />
    </div>
  )
}
