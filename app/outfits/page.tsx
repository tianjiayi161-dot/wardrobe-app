'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Outfit, Clothing } from '@/types'
import { OutfitsGrid } from '@/components/outfits/OutfitsGrid'
import { getWeatherEmoji } from '@/lib/weather'
import { PageHeader } from '@/components/PageHeader'

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [loading, setLoading] = useState(true)
  const [weatherText, setWeatherText] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [customScenes, setCustomScenes] = useState<string[]>([])
  const [showSceneModal, setShowSceneModal] = useState(false)
  const [newSceneName, setNewSceneName] = useState('')
  const [scheduleCounts, setScheduleCounts] = useState<Record<string, number>>({})
  const [recentSchedules, setRecentSchedules] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const saved = window.localStorage.getItem('outfit-scenes')
    if (saved) {
      try {
        setCustomScenes(JSON.parse(saved))
      } catch (error) {
        console.error('解析场景失败:', error)
      }
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('outfit-scenes', JSON.stringify(customScenes))
  }, [customScenes])

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
      const [outfitsRes, clothesRes, schedulesRes] = await Promise.all([
        fetch('/api/outfits'),
        fetch('/api/clothes'),
        fetch('/api/schedules'),
      ])

      if (outfitsRes.ok && clothesRes.ok) {
        const outfitsData = await outfitsRes.json()
        const clothesData = await clothesRes.json()
        setOutfits(outfitsData.outfits ?? [])
        setClothes(clothesData.clothes ?? [])
      }
      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json()
        const counts: Record<string, number> = {}
        const recent: Record<string, number> = {}
        const now = Date.now()
        const recentWindow = 1000 * 60 * 60 * 24 * 30
        for (const item of schedulesData.schedules || []) {
          if (!item.outfitId) continue
          counts[item.outfitId] = (counts[item.outfitId] || 0) + 1
          const date = new Date(item.date).getTime()
          if (now - date <= recentWindow) {
            recent[item.outfitId] = (recent[item.outfitId] || 0) + 1
          }
        }
        setScheduleCounts(counts)
        setRecentSchedules(recent)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filters = [
    { key: 'all', label: 'All ✨' },
    { key: 'daily', label: '日常 🌿' },
    { key: 'commute', label: '通勤 💼' },
    { key: 'sport', label: '运动 🏃' },
    { key: 'date', label: '约会 💗' },
    { key: 'formal', label: '正式 🎩' },
    { key: 'recent', label: '最近常穿 🔥' },
    { key: 'unused', label: '压箱底 🧊' },
  ]

  const filteredOutfits = useMemo(() => {
    if (activeFilter === 'all') return outfits
    return outfits.filter((outfit) => {
      const tagsText = (outfit.tags || []).join(' ').toLowerCase()
      const occasionText = (outfit.occasion || '').toLowerCase()
      const seasonText = (outfit.season || '').toLowerCase()
      if (activeFilter === 'daily') {
        return tagsText.includes('日常') || tagsText.includes('casual') || occasionText.includes('日常')
      }
      if (activeFilter === 'commute') {
        return tagsText.includes('通勤') || occasionText.includes('通勤') || occasionText.includes('work')
      }
      if (activeFilter === 'sport') {
        return tagsText.includes('运动') || tagsText.includes('sport') || occasionText.includes('运动')
      }
      if (activeFilter === 'date') {
        return tagsText.includes('约会') || tagsText.includes('date') || occasionText.includes('约会')
      }
      if (activeFilter === 'formal') {
        return tagsText.includes('正式') || occasionText.includes('正式') || occasionText.includes('office')
      }
      if (activeFilter === 'recent') {
        return (recentSchedules[outfit._id] || 0) > 0
      }
      if (activeFilter === 'unused') {
        return (recentSchedules[outfit._id] || 0) === 0
      }
      if (customScenes.includes(activeFilter)) {
        return tagsText.includes(activeFilter.toLowerCase())
      }
      return false
    })
  }, [activeFilter, outfits, customScenes, recentSchedules])

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="搭配"
        right={
          weatherText ? (
            <span className="text-xs px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
              {weatherText}
            </span>
          ) : null
        }
      />

      {/* 入口板块：自己搭配 & AI搭配 */}
      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 mb-1">自己搭配</div>
            <div className="text-base font-semibold text-black">手动选择衣服</div>
            <div className="mt-2 text-xs text-gray-500">给搭配命名 · 可自定义</div>
          </div>
          <Link
            href="/outfits/create?mode=manual"
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
          >
            开始
          </Link>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 mb-1">AI搭配</div>
            <div className="text-base font-semibold text-black">穿搭实验室</div>
            <div className="mt-2 text-xs text-gray-500">一键生成 · 基于衣橱与天气</div>
          </div>
          <Link
            href="/outfits/create?mode=ai"
            className="px-4 py-2 rounded-lg text-white bg-[color:var(--brand)] text-sm"
          >
            进入
          </Link>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 min-w-[92px] rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center justify-center gap-1 ${
                activeFilter === filter.key
                  ? 'bg-[color:var(--brand)] text-white border border-[color:var(--brand)]'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {filter.label}
            </button>
          ))}
          {customScenes.map((scene) => (
            <button
              key={scene}
              onClick={() => setActiveFilter(scene)}
              className={`px-4 py-2 min-w-[92px] rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center justify-center gap-1 ${
                activeFilter === scene
                  ? 'bg-[color:var(--brand)] text-white border border-[color:var(--brand)]'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {scene}
            </button>
          ))}
          <button
            onClick={() => setShowSceneModal(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[color:var(--brand)] text-white flex-shrink-0"
            aria-label="新建场合"
          >
            +
          </button>
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

      {showSceneModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 w-[90%] max-w-sm">
            <h3 className="text-lg font-semibold text-black mb-2">新建场合</h3>
            <input
              type="text"
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
              placeholder="例如：旅行 / 见家长"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
            />
            <div className="flex gap-2">
              <button
                className="flex-1 px-3 py-2 border rounded-md"
                onClick={() => {
                  setShowSceneModal(false)
                  setNewSceneName('')
                }}
              >
                取消
              </button>
              <button
                className="flex-1 px-3 py-2 bg-black text-white rounded-md"
                onClick={() => {
                  const name = newSceneName.trim()
                  if (!name) return
                  if (!customScenes.includes(name)) {
                    setCustomScenes((prev) => [...prev, name])
                  }
                  setActiveFilter(name)
                  setShowSceneModal(false)
                  setNewSceneName('')
                }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

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
