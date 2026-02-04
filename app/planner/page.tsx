'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Clothing, Outfit } from '@/types'
import { categoryMap, formatDate } from '@/lib/utils'

type PlanType = 'outfit' | 'clothes'

type WearPlan = {
  id: string
  date: string
  type: PlanType
  outfitId?: string
  clothingIds?: string[]
  createdAt: string
}

const STORAGE_KEY = 'wear-plans'

export default function PlannerPage() {
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [plans, setPlans] = useState<WearPlan[]>([])

  const [selectedDate, setSelectedDate] = useState('')
  const [planType, setPlanType] = useState<PlanType>('outfit')
  const [selectedOutfit, setSelectedOutfit] = useState('')
  const [selectedClothes, setSelectedClothes] = useState<string[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clothesRes, outfitsRes] = await Promise.all([
          fetch('/api/clothes'),
          fetch('/api/outfits'),
        ])
        const clothesData = await clothesRes.json()
        const outfitsData = await outfitsRes.json()

        if (clothesData.success) setClothes(clothesData.clothes)
        if (outfitsData.success) setOutfits(outfitsData.outfits)
      } catch (error) {
        console.error('加载数据失败:', error)
      }
    }

    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setPlans(JSON.parse(saved))
      } catch (error) {
        console.error('解析日程失败:', error)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plans))
  }, [plans])

  const plannedByDate = useMemo(() => {
    const grouped: Record<string, WearPlan[]> = {}
    plans
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .forEach((plan) => {
        grouped[plan.date] = grouped[plan.date] || []
        grouped[plan.date].push(plan)
      })
    return grouped
  }, [plans])

  const handleToggleClothing = (id: string) => {
    setSelectedClothes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleAddPlan = () => {
    if (!selectedDate) {
      alert('请选择日期')
      return
    }

    if (planType === 'outfit' && !selectedOutfit) {
      alert('请选择一套搭配')
      return
    }

    if (planType === 'clothes' && selectedClothes.length === 0) {
      alert('请选择要穿的衣服')
      return
    }

    const newPlan: WearPlan = {
      id: `${Date.now()}`,
      date: selectedDate,
      type: planType,
      outfitId: planType === 'outfit' ? selectedOutfit : undefined,
      clothingIds: planType === 'clothes' ? selectedClothes : undefined,
      createdAt: new Date().toISOString(),
    }

    setPlans((prev) => [newPlan, ...prev])
    setSelectedOutfit('')
    setSelectedClothes([])
  }

  const deletePlan = (id: string) => {
    if (!confirm('确定要删除这个日程吗？')) return
    setPlans((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">穿搭日程</h1>
          <p className="text-sm text-gray-600 mt-1">
            规划每天穿什么，保持节奏。
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          返回首页
        </Link>
      </div>

      <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">添加计划</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">日期</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">方式</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPlanType('outfit')}
                className={`flex-1 px-3 py-2 border rounded-md transition-colors ${
                  planType === 'outfit'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                选搭配
              </button>
              <button
                type="button"
                onClick={() => setPlanType('clothes')}
                className={`flex-1 px-3 py-2 border rounded-md transition-colors ${
                  planType === 'clothes'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                选衣服
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">动作</label>
            <button
              type="button"
              onClick={handleAddPlan}
              className="w-full px-3 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              添加到日程
            </button>
          </div>
        </div>

        {planType === 'outfit' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">选择搭配</label>
            <select
              value={selectedOutfit}
              onChange={(e) => setSelectedOutfit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">请选择</option>
              {outfits.map((outfit) => (
                <option key={outfit._id} value={outfit._id}>
                  {outfit.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">选择衣服</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {clothes.map((item) => (
                <label
                  key={item._id}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm cursor-pointer ${
                    selectedClothes.includes(item._id)
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedClothes.includes(item._id)}
                    onChange={() => handleToggleClothing(item._id)}
                  />
                  <span className="truncate">{item.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">日程列表</h2>
        {Object.keys(plannedByDate).length === 0 ? (
          <p className="text-sm text-gray-500">还没有安排日程</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(plannedByDate)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([date, dayPlans]) => (
                <div key={date} className="space-y-3">
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(date)}
                  </div>
                  <div className="space-y-2">
                    {dayPlans.map((plan) => {
                      const outfitName =
                        plan.outfitId &&
                        outfits.find((o) => o._id === plan.outfitId)?.name
                      const clothingNames = (plan.clothingIds || [])
                        .map((id) => clothes.find((c) => c._id === id))
                        .filter(Boolean)
                        .map((c) => `${c?.name} · ${categoryMap[c?.category || ''] || ''}`)

                      return (
                        <div
                          key={plan.id}
                          className="flex items-center justify-between border border-gray-200 rounded-md p-3 text-sm"
                        >
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">
                              {plan.type === 'outfit'
                                ? `搭配：${outfitName || '未命名'}`
                                : '衣服组合'}
                            </div>
                            {plan.type === 'clothes' && (
                              <div className="text-gray-500 text-xs">
                                {clothingNames.join(' / ') || '未选择衣服'}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => deletePlan(plan.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            删除
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  )
}
