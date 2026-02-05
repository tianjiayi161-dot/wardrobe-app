'use client'

import Link from 'next/link'
import { Calendar } from 'lucide-react'

export function UpcomingSchedule() {
  // 暂时显示占位符，等Stage 7实现日程功能后再填充真实数据
  const hasSchedule = false

  return (
    <div className="px-4 pb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-black">即将到来</h2>
        <Link href="/planner" className="text-sm text-gray-600 hover:text-black">
          查看全部 →
        </Link>
      </div>

      {!hasSchedule ? (
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
          {/* 这里将来显示日程列表 */}
        </div>
      )}
    </div>
  )
}
