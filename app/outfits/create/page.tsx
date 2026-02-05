import { Suspense } from 'react'
import CreateOutfitClient from './CreateOutfitClient'

export const dynamic = 'force-dynamic'

export default function CreateOutfitPage() {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-gray-500">加载中...</div>}>
      <CreateOutfitClient />
    </Suspense>
  )
}
