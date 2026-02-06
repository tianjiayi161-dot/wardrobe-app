'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function AIGenerateCard() {
  return (
    <div className="px-4 pt-4 pb-2">
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-3">
          <Sparkles size={18} />
        </div>
        <h3 className="text-lg font-semibold text-black mb-1">AI 搭配</h3>
        <p className="text-sm text-gray-600 mb-4">
          不确定怎么穿？让 AI 根据天气与场景生成搭配。
        </p>
        <Link
          href="/outfits/create?ai=true"
          className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          穿搭实验室
        </Link>
      </div>
    </div>
  )
}
