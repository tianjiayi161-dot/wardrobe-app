'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function AIGenerateCard() {
  return (
    <div className="px-4 pt-4 pb-3">
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={24} />
          <h3 className="text-lg font-semibold">AI智能搭配</h3>
        </div>
        <p className="text-sm text-gray-200 mb-4">
          让AI根据你的衣橱帮你生成完美搭配
        </p>
        <Link
          href="/outfits/create?ai=true"
          className="inline-block px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          生成搭配
        </Link>
      </div>
    </div>
  )
}
