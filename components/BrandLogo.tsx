'use client'

export function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-[22%] bg-white border border-gray-200 shadow-sm flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full text-slate-900 dark:text-white"
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M50 20 V 10 A 5 5 0 0 1 60 10"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <line
          x1="10"
          y1="20"
          x2="90"
          y2="20"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        ></line>
        <g
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="14" y="32" width="28" height="24" rx="4"></rect>
          <path d="M14 42 H42"></path>
          <path d="M20 29 V34 M36 29 V34"></path>
          <circle cx="36" cy="50" r="3" fill="#E6007E" stroke="none"></circle>
          <path d="M60 40 L65 40 L65 36 L79 36 L79 40 L84 40 L84 58 L60 58 Z"></path>
          <path d="M69 36 Q72 40 75 36"></path>
          <circle cx="28" cy="78" r="7"></circle>
          <circle cx="28" cy="65" r="1.5" fill="currentColor" stroke="none"></circle>
          <circle cx="28" cy="91" r="1.5" fill="currentColor" stroke="none"></circle>
          <circle cx="15" cy="78" r="1.5" fill="currentColor" stroke="none"></circle>
          <circle cx="41" cy="78" r="1.5" fill="currentColor" stroke="none"></circle>
          <circle cx="19" cy="69" r="1.5" fill="currentColor" stroke="none"></circle>
          <circle cx="37" cy="69" r="1.5" fill="currentColor" stroke="none"></circle>
          <circle cx="19" cy="87" r="1.5" fill="currentColor" stroke="none"></circle>
          <circle cx="37" cy="87" r="1.5" fill="currentColor" stroke="none"></circle>
          <path d="M64 70 H80 L83 90 Q83 93 79 93 L76 93 L72 82 L68 93 L65 93 Q61 93 61 90 L64 70 Z"></path>
        </g>
      </svg>
    </div>
  )
}
