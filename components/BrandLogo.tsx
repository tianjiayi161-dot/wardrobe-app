'use client'

export function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-[22%] bg-white border border-gray-200 shadow-sm flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-3/5 h-3/5 text-black"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="7"
        viewBox="0 0 100 100"
      >
        <path d="M50 24 V 10 A 7 7 0 0 1 64 10"></path>
        <line x1="15" x2="85" y1="24" y2="24"></line>
        <rect height="24" rx="3" width="24" x="22" y="36"></rect>
        <rect height="24" rx="3" width="24" x="54" y="36"></rect>
        <rect height="24" rx="3" width="24" x="22" y="68"></rect>
        <rect height="24" rx="3" width="24" x="54" y="68"></rect>
      </svg>
    </div>
  )
}
