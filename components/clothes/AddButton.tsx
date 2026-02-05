'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'

export function AddButton() {
  return (
    <Link
      href="/clothes/new"
      className="fixed bottom-20 right-4 w-14 h-14 bg-[color:var(--brand)] text-white rounded-full shadow-lg flex items-center justify-center hover:brightness-95 transition-colors z-40"
      aria-label="添加衣服"
    >
      <Plus size={24} />
    </Link>
  )
}
