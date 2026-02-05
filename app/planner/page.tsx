'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Clothing, Outfit } from '@/types'
import { categoryMap, formatDate } from '@/lib/utils'

type PlanType = 'outfit' | 'clothes'

type WearPlan = {
  id: string
  _id?: string
  date: string
  title: string
  type: PlanType
  outfitId?: string
  clothingIds?: string[]
  tips?: string[]
  createdAt: string
}

type WeatherData = {
  temperature: number
  condition: string
  description: string
  icon: string
}

function buildPlanTips(params: {
  title: string
  clothingItems: Array<Clothing | undefined>
  weather?: WeatherData | null
}) {
  const tips: string[] = []
  const title = params.title.toLowerCase()
  const weather = params.weather
  const categories = new Set(
    params.clothingItems
      .filter(Boolean)
      .map((item) => (item as Clothing).category)
  )
  const colors = new Set(
    params.clothingItems
      .filter(Boolean)
      .flatMap((item) => (item as Clothing).colors || [])
      .map((c) => c.toLowerCase())
  )
  const materialText = params.clothingItems
    .filter(Boolean)
    .map((item) => {
      const c = item as Clothing
      return `${c.name} ${(c.tags || []).join(' ')}`
    })
    .join(' ')
    .toLowerCase()

  if (title.includes('雨') || title.includes('rain')) {
    tips.push('有雨记得带伞')
  }

  if (weather) {
    if (weather.description?.includes('雨') || weather.description?.toLowerCase().includes('rain')) {
      tips.push('天气预报有雨，建议带伞或选择防水外套')
    }
    if (weather.temperature <= 8) {
      tips.push('气温偏低，注意保暖和叠穿')
    } else if (weather.temperature >= 28) {
      tips.push('天气偏热，选择透气材质并注意防晒')
    }
  }

  if (categories.has('shirt')) {
    tips.push('穿衬衫记得提前熨烫')
  }

  if (categories.has('shoes')) {
    tips.push('鞋子材质选择耐脏或防水的')
  }

  if (categories.has('outerwear')) {
    tips.push('出门前确认温差，外套别忘了')
  }

  if (materialText.includes('silk') || materialText.includes('丝') || materialText.includes('真丝')) {
    tips.push('真丝材质避免雨天外出，注意防水')
  }
  if (materialText.includes('wool') || materialText.includes('羊毛')) {
    tips.push('羊毛材质注意防潮，避免长时间淋雨')
  }
  if (materialText.includes('linen') || materialText.includes('亚麻')) {
    tips.push('亚麻易皱，出门前可简单熨烫')
  }
  if (materialText.includes('leather') || materialText.includes('皮革')) {
    tips.push('皮革遇雨及时擦拭，保持干燥')
  }
  if (materialText.includes('denim') || materialText.includes('牛仔')) {
    tips.push('牛仔深色雨天更耐脏')
  }

  if (colors.has('white') || colors.has('白') || colors.has('米')) {
    tips.push('浅色衣物雨天易脏，注意防护')
  }
  if (colors.has('black') || colors.has('黑')) {
    tips.push('深色在晴天更吸热，注意散热')
  }

  if (tips.length === 0) {
    tips.push('出门前看下天气，再决定配饰')
  }

  return tips.slice(0, 3)
}

function fetchTodayWeather(): Promise<WeatherData | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(
            `/api/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          )
          if (!res.ok) {
            resolve(null)
            return
          }
          const data = await res.json()
          resolve(data)
        } catch (error) {
          resolve(null)
        }
      },
      () => resolve(null),
      { timeout: 8000 }
    )
  })
}

export default function PlannerPage() {
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [plans, setPlans] = useState<WearPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)

  const [selectedDate, setSelectedDate] = useState('')
  const [planTitle, setPlanTitle] = useState('')
  const [planType, setPlanType] = useState<PlanType>('outfit')
  const [selectedOutfit, setSelectedOutfit] = useState('')
  const [selectedClothes, setSelectedClothes] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

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

    loadData()
  }, [])

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
        setPlansLoading(false)
      }
    }
    loadPlans()
  }, [])

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

  const handleAddPlan = async () => {
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

    const outfitName =
      planType === 'outfit'
        ? outfits.find((o) => o._id === selectedOutfit)?.name
        : undefined

    const selectedClothingItems =
      planType === 'outfit'
        ? outfits
            .find((o) => o._id === selectedOutfit)
            ?.clothingIds.map((id) => clothes.find((c) => c._id === id))
            .filter(Boolean) || []
        : selectedClothes
            .map((id) => clothes.find((c) => c._id === id))
            .filter(Boolean)

    const resolvedTitle =
      planTitle.trim() ||
      (planType === 'outfit' ? outfitName || '搭配' : '衣服组合')

    const isToday = (() => {
      const today = new Date()
      const selected = new Date(selectedDate)
      if (Number.isNaN(selected.getTime())) return false
      return (
        selected.getFullYear() === today.getFullYear() &&
        selected.getMonth() === today.getMonth() &&
        selected.getDate() === today.getDate()
      )
    })()

    const weather = isToday ? await fetchTodayWeather() : null

    const tips = buildPlanTips({
      title: resolvedTitle,
      clothingItems: selectedClothingItems,
      weather,
    })

    const payload = {
      title: resolvedTitle,
      date: selectedDate,
      type: planType,
      outfitId: planType === 'outfit' ? selectedOutfit : undefined,
      clothingIds: planType === 'clothes' ? selectedClothes : undefined,
      tips,
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/schedules/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!data.success) {
          alert(data.error || '更新失败')
          return
        }
        setPlans((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, ...payload } : p))
        )
      } else {
        const res = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!data.success) {
          alert(data.error || '创建失败')
          return
        }
        const created: WearPlan = {
          id: data.schedule._id,
          ...payload,
          createdAt: data.schedule.createdAt,
        }
        setPlans((prev) => [created, ...prev])
      }
    } catch (error) {
      console.error('保存日程失败:', error)
      alert('保存失败，请稍后重试')
      return
    }

    setEditingId(null)
    setPlanTitle('')
    setSelectedOutfit('')
    setSelectedClothes([])
  }

  const deletePlan = async (id: string) => {
    if (!confirm('确定要删除这个日程吗？')) return
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) {
        alert(data.error || '删除失败')
        return
      }
      setPlans((prev) => prev.filter((item) => item.id !== id))
    } catch (error) {
      console.error('删除日程失败:', error)
      alert('删除失败，请稍后重试')
    }
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingId ? '编辑计划' : '添加计划'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setPlanTitle('')
                setSelectedOutfit('')
                setSelectedClothes([])
              }}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              取消编辑
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">日期</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <p className="text-xs text-gray-500">天气提醒仅对当天生效</p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-900">日程名称</label>
            <input
              type="text"
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              placeholder="例如：客户会议 / 朋友聚餐"
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
              {editingId ? '保存修改' : '添加到日程'}
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
        {plansLoading ? (
          <p className="text-sm text-gray-500">加载中...</p>
        ) : Object.keys(plannedByDate).length === 0 ? (
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
                          className="flex items-start justify-between border border-gray-200 rounded-md p-3 text-sm"
                        >
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">
                              {plan.title || (plan.type === 'outfit'
                                ? `搭配：${outfitName || '未命名'}`
                                : '衣服组合')}
                            </div>
                            {plan.type === 'clothes' && (
                              <div className="text-gray-500 text-xs">
                                {clothingNames.join(' / ') || '未选择衣服'}
                              </div>
                            )}
                            {plan.tips && plan.tips.length > 0 && (
                              <div className="text-xs text-gray-500">
                                AI提示：{plan.tips.join('；')}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => {
                                setEditingId(plan.id)
                                setSelectedDate(plan.date)
                                setPlanTitle(plan.title)
                                setPlanType(plan.type)
                                setSelectedOutfit(plan.outfitId || '')
                                setSelectedClothes(plan.clothingIds || [])
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => deletePlan(plan.id)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              删除
                            </button>
                          </div>
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
