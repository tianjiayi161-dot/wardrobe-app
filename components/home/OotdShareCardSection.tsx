'use client'

import { useEffect, useMemo, useState } from 'react'
import { OotdShareCard } from '@/components/ootd/OotdShareCard'

type ClothingItem = {
  _id: string
  imageUrl: string
  name?: string
}

type ScheduleItem = {
  _id: string
  date: string
  type: 'outfit' | 'clothes'
  outfitId?: string
  clothingIds?: string[]
  repeatType?: 'none' | 'daily' | 'workdays' | 'custom'
  repeatDays?: number[]
}

const formatDateLabel = (date: Date) => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const day = String(date.getDate()).padStart(2, '0')
  const month = months[date.getMonth()]
  return `${day} ${month}`
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const isRepeatToday = (plan: ScheduleItem, today: Date) => {
  const baseDate = new Date(plan.date)
  if (Number.isNaN(baseDate.getTime())) return false
  if (today < baseDate) return false

  switch (plan.repeatType) {
    case 'daily':
      return true
    case 'workdays':
      return today.getDay() >= 1 && today.getDay() <= 5
    case 'custom':
      return (plan.repeatDays || []).includes(today.getDay())
    default:
      return false
  }
}

export function OotdShareCardSection() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasTodayPlan, setHasTodayPlan] = useState(false)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const [scheduleRes, clothesRes] = await Promise.all([
          fetch('/api/schedules'),
          fetch('/api/clothes'),
        ])
        const scheduleData = await scheduleRes.json()
        const clothesData = await clothesRes.json()

        const schedules: ScheduleItem[] = scheduleData.success ? scheduleData.schedules || [] : []
        const clothes: ClothingItem[] = clothesData.success ? clothesData.clothes || [] : []

        const today = new Date()
        const todayPlan = schedules.find((plan) => {
          const planDate = new Date(plan.date)
          if (Number.isNaN(planDate.getTime())) return false
          if (isSameDay(planDate, today)) return true
          return isRepeatToday(plan, today)
        })

        if (!todayPlan) {
          setItems([])
          setHasTodayPlan(false)
          return
        }

        setHasTodayPlan(true)

        if (todayPlan.type === 'outfit' && todayPlan.outfitId) {
          const outfitRes = await fetch(`/api/outfits/${todayPlan.outfitId}`)
          const outfitData = await outfitRes.json()
          if (outfitData.success) {
            const outfitClothes = (outfitData.clothes || []) as ClothingItem[]
            setItems(outfitClothes.slice(0, 3))
            return
          }
        }

        if (todayPlan.type === 'clothes' && Array.isArray(todayPlan.clothingIds)) {
          const byId = new Map(clothes.map((item) => [item._id, item]))
          const picked = todayPlan.clothingIds
            .map((id) => byId.get(id))
            .filter(Boolean) as ClothingItem[]
          setItems(picked.slice(0, 3))
          return
        }

        setItems([])
      } catch (error) {
        console.error('获取今日穿搭失败:', error)
        setItems([])
        setHasTodayPlan(false)
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
      {hasTodayPlan ? (
        <OotdShareCard dateLabel={formatDateLabel(new Date())} items={cardItems} />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
          今日还没有准备好穿什么嘛
        </div>
      )}
    </div>
  )
}
