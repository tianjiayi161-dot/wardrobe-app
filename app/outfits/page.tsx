'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Outfit, Clothing } from '@/types'
import { AIGenerateCard } from '@/components/outfits/AIGenerateCard'
import { OutfitsGrid } from '@/components/outfits/OutfitsGrid'

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [outfitsRes, clothesRes] = await Promise.all([
        fetch('/api/outfits'),
        fetch('/api/clothes')
      ])

      if (outfitsRes.ok && clothesRes.ok) {
        const outfitsData = await outfitsRes.json()
        const clothesData = await clothesRes.json()
        setOutfits(outfitsData)
        setClothes(clothesData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AI生成卡片 */}
      <AIGenerateCard />

      {/* 搭配网格 */}
      <OutfitsGrid outfits={outfits} clothes={clothes} loading={loading} />

      {/* 创建搭配按钮 */}
      <Link
        href="/outfits/create"
        className="fixed bottom-20 right-4 w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors z-40"
        aria-label="创建搭配"
      >
        <Plus size={24} />
      </Link>
    </div>
  )
}
