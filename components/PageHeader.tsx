'use client'

import { ReactNode } from 'react'
import { BrandLogo } from '@/components/BrandLogo'

export function PageHeader({
  title,
  right,
}: {
  title: string
  right?: ReactNode
}) {
  return (
    <div className="px-4 pt-6 pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo className="w-12 h-12" />
          <div>
            <div className="text-xs text-gray-500">vibelog</div>
            <h1 className="text-2xl font-bold text-black">{title}</h1>
          </div>
        </div>
        {right}
      </div>
    </div>
  )
}
