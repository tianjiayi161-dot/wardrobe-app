'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Clothing } from '@/types'
import { categoryMap, colorMap } from '@/lib/utils'

export default function ClothesPage() {
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchClothes()
  }, [selectedCategory])

  const fetchClothes = async () => {
    try {
      const url =
        selectedCategory === 'all'
          ? '/api/clothes'
          : `/api/clothes?category=${selectedCategory}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setClothes(data.clothes)
      }
    } catch (error) {
      console.error('获取衣服列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteClothing = async (id: string) => {
    if (!confirm('确定要删除这件衣服吗？')) return

    try {
      const response = await fetch(`/api/clothes/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setClothes(clothes.filter((c) => c._id !== id))
        alert('删除成功')
      } else {
        alert(data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请稍后重试')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">我的衣服</h1>
        <Link
          href="/clothes/new"
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          添加衣服
        </Link>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-md transition-colors ${
            selectedCategory === 'all'
              ? 'bg-black text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          全部
        </button>
        {Object.entries(categoryMap).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedCategory === key
                ? 'bg-black text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : clothes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">还没有添加衣服</p>
          <Link
            href="/clothes/new"
            className="inline-block px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            添加第一件衣服
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {clothes.map((clothing) => (
            <div
              key={clothing._id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-square">
                <Image
                  src={clothing.thumbnail}
                  alt={clothing.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-3 space-y-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {clothing.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {categoryMap[clothing.category]}
                </p>
                <div className="flex gap-1 flex-wrap">
                  {clothing.colors.map((color) => (
                    <span
                      key={color}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                    >
                      {colorMap[color] || color}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Link
                    href={`/clothes/${clothing._id}`}
                    className="flex-1 text-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                  >
                    查看
                  </Link>
                  <button
                    onClick={() => deleteClothing(clothing._id)}
                    className="flex-1 px-3 py-1 bg-red-50 text-red-600 text-sm rounded hover:bg-red-100 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
