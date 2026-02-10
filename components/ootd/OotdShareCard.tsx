import html2canvas from 'html2canvas'
import { useMemo, useRef, useState } from 'react'

type OotdItem = {
  id: string
  imageUrl: string
  alt?: string
}

type OotdShareCardProps = {
  dateLabel: string
  weatherIcon?: string
  slogan?: string
  backgroundImage?: string
  items: OotdItem[]
}

const DEFAULT_SLOGAN = "今晚早点睡，搭配的事交给『衣序』"

const rotationPreset = [-3, -1, 1, 3]

export function OotdShareCard({
  dateLabel,
  weatherIcon,
  slogan = DEFAULT_SLOGAN,
  backgroundImage,
  items,
}: OotdShareCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [exporting, setExporting] = useState(false)

  const rotations = useMemo(() => {
    return items.map((item, index) => ({
      id: item.id,
      deg: rotationPreset[index % rotationPreset.length],
    }))
  }, [items])

  const handleExport = async () => {
    if (!cardRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      })
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `ootd-${Date.now()}.png`
      link.click()
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败，请稍后重试')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="relative mx-auto w-[360px] h-[640px] rounded-[28px] overflow-hidden border border-white/30 shadow-2xl bg-white"
        style={{
          backgroundImage: backgroundImage
            ? `url(${backgroundImage})`
            : 'linear-gradient(135deg, #FFF6E9 0%, #E6F0FF 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-white/55 backdrop-blur-[25px]" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-6 left-6">
            <div className="text-[42px] font-semibold tracking-wide text-slate-900">
              {dateLabel}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              {weatherIcon ? (
                <img
                  src={weatherIcon}
                  alt="weather"
                  className="h-5 w-5"
                  crossOrigin="anonymous"
                />
              ) : (
                <span className="text-[#E91E63]">●</span>
              )}
              <span>Today&apos;s Look</span>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center justify-center gap-6 px-8">
            {items.slice(0, 3).map((item, index) => {
              const rotation = rotations[index]?.deg ?? 0
              return (
                <div
                  key={item.id}
                  className="relative w-40 h-40 rounded-2xl bg-white/90 shadow-xl border border-white/70"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.alt || 'ootd item'}
                    className="absolute inset-0 w-full h-full object-contain p-4"
                    crossOrigin="anonymous"
                  />
                </div>
              )
            })}
            {items.length === 0 && (
              <div className="text-sm text-slate-500">暂无今日穿搭</div>
            )}
          </div>
        </div>

        <div className="absolute left-8 right-8 bottom-10 text-center">
          <div className="mb-3 h-[2px] w-full bg-[#E91E63]/80 rounded-full" />
          <div className="text-sm text-slate-700 font-medium">
            {slogan}
          </div>
        </div>

        <div className="absolute top-6 right-6 h-3 w-3 rounded-full bg-[#E91E63]" />
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 rounded-full bg-[#E91E63] text-white text-sm font-semibold shadow-md disabled:bg-gray-400"
        >
          {exporting ? '生成中...' : '一键导出 1080x1920'}
        </button>
      </div>
    </div>
  )
}
