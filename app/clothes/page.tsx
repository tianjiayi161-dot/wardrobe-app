'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Clothing } from '@/types'
import { SearchBar } from '@/components/clothes/SearchBar'
import { FilterTabs, FilterType } from '@/components/clothes/FilterTabs'
import { ClothesGrid } from '@/components/clothes/ClothesGrid'
import { AddButton } from '@/components/clothes/AddButton'
import { CategoryStackGrid } from '@/components/clothes/CategoryStackGrid'
import { PageHeader } from '@/components/PageHeader'
import { ArrowDown, ArrowUp } from 'lucide-react'

export default function ClothesPage() {
  const [allClothes, setAllClothes] = useState<Clothing[]>([])
  const [filteredClothes, setFilteredClothes] = useState<Clothing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('time')
  const [sortKey, setSortKey] = useState<'time' | 'wear'>('time')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchClothes()
  }, [])

  useEffect(() => {
    filterClothes()
  }, [searchQuery, activeFilter, allClothes])

  const fetchClothes = async () => {
    try {
      const response = await fetch('/api/clothes')
      if (response.ok) {
        const data = await response.json()
        setAllClothes(data.clothes ?? [])
      }
    } catch (error) {
      console.error('Failed to fetch clothes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterClothes = () => {
    let filtered = [...allClothes]

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          item.colors.some((color) => color.toLowerCase().includes(query))
      )
    }

    // 筛选类型
    if (activeFilter === 'category') {
      filtered.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category)
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    } else {
      if (sortKey === 'time') {
        filtered.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      } else {
        filtered.sort((a, b) => (a.wearCount || 0) - (b.wearCount || 0))
      }
      if (sortDir === 'desc') filtered.reverse()
    }

    setFilteredClothes(filtered)
  }

  const categoryViewClothes = useMemo(() => {
    return filteredClothes
  }, [filteredClothes])

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="衣橱" />
      {/* 搜索栏 */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* 筛选标签 */}
      <FilterTabs
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {activeFilter !== 'category' && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSortKey('time')}
            className={`px-3 py-2 rounded-md text-sm border flex items-center gap-2 ${
              sortKey === 'time'
                ? 'bg-[color:#E6007E] text-white border-[color:#E6007E]'
                : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            按时间
            {sortKey === 'time' && (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
          </button>
          <button
            type="button"
            onClick={() => setSortKey('wear')}
            className={`px-3 py-2 rounded-md text-sm border flex items-center gap-2 ${
              sortKey === 'wear'
                ? 'bg-[color:#E6007E] text-white border-[color:#E6007E]'
                : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            按穿着
            {sortKey === 'wear' && (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
          </button>
          <button
            type="button"
            onClick={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="ml-auto px-3 py-2 rounded-md text-sm border bg-white text-gray-700 border-gray-200 flex items-center gap-2"
          >
            {sortDir === 'asc' ? '升序' : '降序'}
            {sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          </button>
        </div>
      )}

      {/* 衣服内容 */}
      {activeFilter === 'category' ? (
        <CategoryStackGrid clothes={categoryViewClothes} loading={loading} />
      ) : (
        <ClothesGrid clothes={filteredClothes} loading={loading} />
      )}

      {/* 添加按钮 */}
      <AddButton />
    </div>
  )
}
