'use client'

import { cn } from '@/lib/utils'

export type FilterType = 'time' | 'wear' | 'category'

interface FilterTabsProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  categories?: { value: string; label: string; count: number }[]
}

export function FilterTabs({ activeFilter, onFilterChange, categories = [] }: FilterTabsProps) {
  const tabs = [
    { value: 'time' as FilterType, label: '按添加时间' },
    { value: 'wear' as FilterType, label: '按穿着次数' },
    { value: 'category' as FilterType, label: '按分类' },
  ]

  return (
    <div className="px-4 pb-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onFilterChange(tab.value)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              activeFilter === tab.value
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 类别选择 */}
      {activeFilter === 'category' && categories.length > 0 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.value}
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:border-black transition-colors"
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
