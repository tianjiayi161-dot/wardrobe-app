'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Clothing } from '@/types'
import { SearchBar } from '@/components/clothes/SearchBar'
import { FilterTabs, FilterType } from '@/components/clothes/FilterTabs'
import { ClothesGrid } from '@/components/clothes/ClothesGrid'
import { AddButton } from '@/components/clothes/AddButton'
import { CategoryStackGrid } from '@/components/clothes/CategoryStackGrid'
import { PageHeader } from '@/components/PageHeader'

export default function ClothesPage() {
  const [allClothes, setAllClothes] = useState<Clothing[]>([])
  const [filteredClothes, setFilteredClothes] = useState<Clothing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('time')

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
    switch (activeFilter) {
      case 'time':
        filtered.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        break
      case 'wear':
        filtered.sort((a, b) => (b.wearCount || 0) - (a.wearCount || 0))
        break
      case 'category':
        filtered.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category)
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        break
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
