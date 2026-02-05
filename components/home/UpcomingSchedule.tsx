'use client'

import Link from 'next/link'
import { Calendar, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { formatDate } from '@/lib/utils'

type PlanType = 'outfit' | 'clothes'

type WearPlan = {
  id: string
  date: string
  title?: string
  type: PlanType
  outfitId?: string
  clothingIds?: string[]
  tips?: string[]
  createdAt: string
}

export function UpcomingSchedule() {
  const [plans, setPlans] = useState<WearPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await fetch('/api/schedules')
        const data = await res.json()
        if (data.success) {
          const mapped = (data.schedules || []).map((item: any) => ({
            ...item,
            id: item._id,
          }))
          setPlans(mapped)
        }
      } catch (error) {
        console.error('加载日程失败:', error)
      } finally {
        setLoading(false)
      }
    }
    loadPlans()
  }, [])

  const upcomingPlans = useMemo(() => {
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return plans
      .filter((plan) => {
        const date = new Date(plan.date)
        return !Number.isNaN(date.getTime()) && date >= startOfToday
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3)
  }, [plans])

  return (
    <div className="px-4 pb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-black">即将到来</h2>
        <Link href="/planner" className="text-sm text-gray-600 hover:text-black">
          查看全部 →
        </Link>
      </div>

      {loading ? (
        <div className="p-6 text-center bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : upcomingPlans.length === 0 ? (
        <div className="p-6 text-center bg-white border border-gray-200 rounded-lg">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-4">还没有日程安排</p>
          <Link
            href="/planner"
            className="inline-block px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            创建日程
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    {formatDate(plan.date)}
                  </div>
                  <div className="text-sm font-semibold text-black">
                    {plan.title || (plan.type === 'outfit' ? '搭配安排' : '衣服组合')}
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {plan.type === 'outfit' ? '搭配' : '衣服'}
                </span>
              </div>

              {plan.tips && plan.tips.length > 0 && (
                <div className="mt-3 flex items-start gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-md p-2">
                  <Sparkles size={14} className="mt-0.5 text-gray-500" />
                  <span>AI提示：{plan.tips.join('；')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
