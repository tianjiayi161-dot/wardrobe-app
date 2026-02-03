'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AIRecommendation } from '@/types'

export default function HomePage() {
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])

  const generateRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 3 }),
      })

      const data = await response.json()

      if (data.success) {
        setRecommendations(data.recommendations)
      } else {
        alert(data.error || '生成推荐失败')
      }
    } catch (error) {
      console.error('生成推荐失败:', error)
      alert('生成推荐失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const saveRecommendation = async (rec: AIRecommendation) => {
    try {
      const response = await fetch('/api/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: rec.outfitName,
          description: rec.description,
          clothingIds: rec.clothingIds,
          occasion: rec.occasion,
          season: rec.season,
          isAIGenerated: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('搭配已保存！')
      } else {
        alert(data.error || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请稍后重试')
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          欢迎来到你的电子衣橱
        </h1>
        <p className="text-lg text-gray-600">
          智能管理你的衣服，AI 帮你搭配
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/clothes/new"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-center"
        >
          <div className="text-3xl mb-2">👕</div>
          <h3 className="font-semibold text-gray-900">添加衣服</h3>
          <p className="text-sm text-gray-600 mt-1">上传照片，AI 自动识别</p>
        </Link>

        <Link
          href="/clothes"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-center"
        >
          <div className="text-3xl mb-2">👚</div>
          <h3 className="font-semibold text-gray-900">浏览衣橱</h3>
          <p className="text-sm text-gray-600 mt-1">查看所有衣服</p>
        </Link>

        <Link
          href="/outfits/create"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-center"
        >
          <div className="text-3xl mb-2">✨</div>
          <h3 className="font-semibold text-gray-900">创建搭配</h3>
          <p className="text-sm text-gray-600 mt-1">手动组合搭配</p>
        </Link>
      </div>

      {/* AI Recommendations */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">AI 推荐搭配</h2>
          <button
            onClick={generateRecommendations}
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '生成中...' : '生成推荐'}
          </button>
        </div>

        {recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-lg border border-gray-200 space-y-3"
              >
                <h3 className="font-semibold text-lg text-gray-900">
                  {rec.outfitName}
                </h3>
                <p className="text-sm text-gray-600">{rec.description}</p>
                <div className="text-xs text-gray-500">
                  <p>推荐理由: {rec.reasoning}</p>
                  {rec.occasion && <p className="mt-1">场合: {rec.occasion}</p>}
                  {rec.season && <p className="mt-1">季节: {rec.season}</p>}
                </div>
                <button
                  onClick={() => saveRecommendation(rec)}
                  className="w-full px-3 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
                >
                  保存这套搭配
                </button>
              </div>
            ))}
          </div>
        )}

        {recommendations.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">点击"生成推荐"获取 AI 搭配建议</p>
          </div>
        )}
      </div>
    </div>
  )
}
