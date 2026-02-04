'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="max-w-xl w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">电子衣橱</h1>
        <p className="text-sm text-gray-600">
          从添加第一件衣服开始，后续可以在导航中查看我的衣橱与我的搭配。
        </p>
        <div className="flex justify-center">
          <Link
            href="/clothes/new"
            className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            添加衣服
          </Link>
        </div>
      </div>
    </div>
  )
}
