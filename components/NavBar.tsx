'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { usePathname } from 'next/navigation'

export default function NavBar() {
  const { user, logout, loading } = useAuth()
  const pathname = usePathname()

  // Don't show nav on login/register pages
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  if (loading) {
    return <div className="h-16" />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <Link href="/" className="text-xl font-bold text-gray-900">
          衣历
        </Link>
        <div className="flex items-center space-x-6">
          <Link href="/clothes" className="text-gray-700 hover:text-gray-900 transition-colors">
            我的衣橱
          </Link>
          <Link href="/outfits" className="text-gray-700 hover:text-gray-900 transition-colors">
            我的搭配
          </Link>
          <Link href="/planner" className="text-gray-700 hover:text-gray-900 transition-colors">
            穿搭日程
          </Link>
          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.name}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                登出
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
