'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getThumbnailUrl } from '@/lib/utils'
import type { Clothing, Outfit } from '@/types'
import { getWeatherEmoji } from '@/lib/weather'

type WeatherData = {
  temperature: number
  condition: string
  description: string
  icon: string
}

export function TomorrowPreview() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [scheduleTitle, setScheduleTitle] = useState<string>('暂无安排')
  const [previewClothes, setPreviewClothes] = useState<Clothing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [schedulesRes, outfitsRes, clothesRes] = await Promise.all([
          fetch('/api/schedules'),
          fetch('/api/outfits'),
          fetch('/api/clothes'),
        ])
        const schedulesData = await schedulesRes.json()
        const outfitsData = await outfitsRes.json()
        const clothesData = await clothesRes.json()

        const clothes: Clothing[] = clothesData.clothes || []
        const clothesById = new Map(clothes.map((c) => [c._id, c]))

        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const key = tomorrow.toISOString().slice(0, 10)
        const tomorrowPlan = (schedulesData.schedules || []).find(
          (p: any) => p.date === key
        )
        if (tomorrowPlan?.title) {
          setScheduleTitle(tomorrowPlan.title)
        }

        // 优先用AI推荐，否则用已有搭配
        let clothingIds: string[] = []
        try {
          const recRes = await fetch('/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: 1 }),
          })
          const recData = await recRes.json()
          if (recData.success && recData.recommendations?.length) {
            clothingIds = recData.recommendations[0].clothingIds || []
          }
        } catch (error) {
          // ignore
        }

        if (clothingIds.length === 0) {
          const outfits: Outfit[] = outfitsData.outfits || []
          clothingIds = outfits[0]?.clothingIds || []
        }

        const preview = clothingIds
          .map((id) => clothesById.get(id))
          .filter(Boolean)
          .slice(0, 4) as Clothing[]
        setPreviewClothes(preview)
      } catch (error) {
        console.error('加载预告失败:', error)
      } finally {
        setLoading(false)
      }
    }

    load()
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
          setWeather(data)
        } catch (error) {
          console.error('获取天气失败:', error)
        }
      },
      () => undefined,
      { timeout: 8000 }
    )
  }, [])

  return (
    <div className="px-4 pb-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <h2 className="text-lg font-semibold text-black mb-3">
          今日谢幕 & 明日预告
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-gray-500">明日天气</div>
            <div className="text-sm font-medium text-black">
              {weather ? `${getWeatherEmoji(weather.icon)} ${weather.temperature}°C` : '—'}
            </div>
            <div className="text-xs text-gray-500 mt-2">核心日程</div>
            <div className="text-sm font-medium text-black truncate">
              {scheduleTitle}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">AI 预设穿搭</div>
            <div className="grid grid-cols-2 gap-1">
              {(loading ? [1, 2, 3, 4] : previewClothes).map((item: any, idx) => (
                <div key={idx} className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                  {item?.imageUrl ? (
                    <img
                      src={getThumbnailUrl(item.imageUrl, 240)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
        <Link
          href="/outfits/create?mode=ai"
          className="mt-4 inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg text-white bg-[color:var(--brand)]"
        >
          穿搭实验室
        </Link>
      </div>
    </div>
  )
}
