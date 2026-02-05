'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShirtIcon, Sparkles, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()

  // 不在登录/注册页面显示底部导航
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  const navItems = [
    { href: '/', label: '主页', icon: Home },
    { href: '/clothes', label: '衣橱', icon: ShirtIcon },
    { href: '/outfits', label: '搭配', icon: Sparkles },
    { href: '/planner', label: '日程', icon: Calendar },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                isActive ? "text-[color:var(--brand)]" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
              <span className={cn(
                "text-xs mt-1",
                isActive ? "font-medium" : "font-normal"
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
