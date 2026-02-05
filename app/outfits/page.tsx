'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Outfit, Clothing } from '@/types'
import { AIGenerateCard } from '@/components/outfits/AIGenerateCard'
import { OutfitsGrid } from '@/components/outfits/OutfitsGrid'
import { getWeatherEmoji } from '@/lib/weather'

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [loading, setLoading] = useState(true)
  const [weatherText, setWeatherText] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(
            `/api/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          )
          if (!res.ok) return
          const data = await res.json()
          const emoji = getWeatherEmoji(data.icon)
          setWeatherText(`${emoji} ${data.temperature}°C`)
        } catch (error) {
          console.error('获取天气失败:', error)
        }
      },
      () => undefined,
      { timeout: 8000 }
    )
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
        setOutfits(outfitsData.outfits ?? [])
        setClothes(clothesData.clothes ?? [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filters = [
    { key: 'all', label: 'All ✨' },
    { key: 'summer', label: 'Summer ☀️' },
    { key: 'work', label: 'Work 💼' },
    { key: 'casual', label: 'Casual 🧢' },
  ]

  const filteredOutfits = useMemo(() => {
    if (activeFilter === 'all') return outfits
    return outfits.filter((outfit) => {
      const tagsText = (outfit.tags || []).join(' ').toLowerCase()
      const occasionText = (outfit.occasion || '').toLowerCase()
      const seasonText = (outfit.season || '').toLowerCase()
      if (activeFilter === 'summer') {
        return seasonText.includes('summer') || tagsText.includes('summer') || tagsText.includes('夏')
      }
      if (activeFilter === 'work') {
        return (
          occasionText.includes('work') ||
          occasionText.includes('office') ||
          occasionText.includes('商务') ||
          occasionText.includes('通勤') ||
          tagsText.includes('work') ||
          tagsText.includes('office') ||
          tagsText.includes('正式')
        )
      }
      if (activeFilter === 'casual') {
        return (
          occasionText.includes('casual') ||
          occasionText.includes('休闲') ||
          tagsText.includes('casual') ||
          tagsText.includes('休闲')
        )
      }
      return true
    })
  }, [activeFilter, outfits])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">搭配</h1>
          {weatherText && (
            <span className="text-xs px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
              {weatherText}
            </span>
          )}
        </div>
      </div>

      {/* 选择创建方式 */}
      <div className="px-4 pt-4 pb-2">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/outfits/create?mode=manual"
            className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-sm text-gray-500 mb-1">自己搭配</div>
            <div className="text-base font-semibold text-black">手动选择衣服</div>
            <div className="mt-3 text-xs text-gray-500">给搭配命名 · 可自定义</div>
          </Link>
          <Link
            href="/outfits/create?mode=ai"
            className="bg-gray-50 border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-sm text-gray-500 mb-1">AI 搭配</div>
            <div className="text-base font-semibold text-black">一键生成</div>
            <div className="mt-3 text-xs text-gray-500">基于衣橱与天气</div>
          </Link>
        </div>
      </div>

      {/* AI生成卡片 */}
      <AIGenerateCard />

      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter.key
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 flex items-center justify-between pb-2">
        <h2 className="text-lg font-semibold text-black">我的搭配</h2>
        <Link href="/outfits" className="text-sm text-gray-500">
          View all
        </Link>
      </div>

      {/* 搭配网格 */}
      <OutfitsGrid outfits={filteredOutfits} clothes={clothes} loading={loading} />

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
