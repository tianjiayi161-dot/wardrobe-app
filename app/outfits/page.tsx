'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Outfit } from '@/types'
import { formatDate } from '@/lib/utils'

type OutfitTab = 'custom' | 'ai'

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<OutfitTab>('custom')

  useEffect(() => {
    fetchOutfits()
  }, [])

  const fetchOutfits = async () => {
    try {
      const response = await fetch('/api/outfits')
      const data = await response.json()

      if (data.success) {
        setOutfits(data.outfits)
      }
    } catch (error) {
      console.error('获取搭配列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteOutfit = async (id: string) => {
    if (!confirm('确定要删除这套搭配吗？')) return

    try {
      const response = await fetch(`/api/outfits/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setOutfits(outfits.filter((o) => o._id !== id))
        alert('删除成功')
      } else {
        alert(data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请稍后重试')
    }
  }

  const filteredOutfits = useMemo(() => {
    return outfits.filter((o) => (tab === 'custom' ? !o.isAIGenerated : o.isAIGenerated))
  }, [outfits, tab])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">我的搭配</h1>
        <div className="flex gap-3">
          <Link
            href="/outfits/create"
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            自创搭配
          </Link>
          <Link
            href="/#ai"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            AI帮我搭
          </Link>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('custom')}
          className={`px-4 py-2 rounded-md border transition-colors ${
            tab === 'custom'
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          自创搭配
        </button>
        <button
          onClick={() => setTab('ai')}
          className={`px-4 py-2 rounded-md border transition-colors ${
            tab === 'ai'
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          AI帮我搭
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : filteredOutfits.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">
            {tab === 'custom' ? '还没有创建自创搭配' : '还没有 AI 搭配'}
          </p>
          {tab === 'custom' ? (
            <Link
              href="/outfits/create"
              className="inline-block px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              创建第一套搭配
            </Link>
          ) : (
            <Link
              href="/#ai"
              className="inline-block px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              去生成 AI 推荐
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOutfits.map((outfit) => (
            <div
              key={outfit._id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow space-y-3"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg text-gray-900">
                  {outfit.name}
                </h3>
                {outfit.isAIGenerated && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    AI推荐
                  </span>
                )}
              </div>

              {outfit.description && (
                <p className="text-sm text-gray-600">{outfit.description}</p>
              )}

              <div className="flex flex-wrap gap-2 text-xs">
                {outfit.occasion && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {outfit.occasion}
                  </span>
                )}
                {outfit.season && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {outfit.season}
                  </span>
                )}
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                  {outfit.clothingIds.length} 件衣服
                </span>
              </div>

              <p className="text-xs text-gray-500">
                创建于 {formatDate(outfit.createdAt)}
              </p>

              <div className="flex gap-2 pt-2">
                <Link
                  href={`/outfits/${outfit._id}`}
                  className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                >
                  查看详情
                </Link>
                <button
                  onClick={() => deleteOutfit(outfit._id)}
                  className="flex-1 px-3 py-2 bg-red-50 text-red-600 text-sm rounded hover:bg-red-100 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
