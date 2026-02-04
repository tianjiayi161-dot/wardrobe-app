'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { GeminiAnalysisResult } from '@/types'

const CATEGORY_OPTIONS = ['top', 'bottom', 'outerwear', 'shoes', 'accessory'] as const

type AnalysisMode = 'fast' | 'enhanced' | 'assist'

type Category = (typeof CATEGORY_OPTIONS)[number]

function NewClothingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  const initialCategory = (CATEGORY_OPTIONS.includes(categoryParam as Category)
    ? categoryParam
    : 'top') as Category

  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('fast')
  const [analysisStep, setAnalysisStep] = useState(0)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [pendingAnalysis, setPendingAnalysis] = useState<GeminiAnalysisResult | null>(null)

  const analysisSteps = useMemo(
    () => ['读取图片', '提取轮廓', '识别颜色', '判断类别', '生成标签'],
    []
  )

  const [formData, setFormData] = useState({
    name: '',
    category: initialCategory,
    colors: [] as string[],
    season: [] as string[],
    style: [] as string[],
    imageUrl: '',
    thumbnail: '',
    tags: [] as string[],
    brand: '',
    price: undefined as number | undefined,
  })

  useEffect(() => {
    if (!analyzing) {
      setAnalysisStep(0)
      return
    }

    const timer = setInterval(() => {
      setAnalysisStep((prev) => (prev + 1) % analysisSteps.length)
    }, 900)

    return () => clearInterval(timer)
  }, [analyzing, analysisSteps])

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const downscaleBase64 = async (base64: string, maxSize: number = 768) => {
    return new Promise<string>((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const width = Math.round(img.width * scale)
        const height = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(base64)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = () => resolve(base64)
      img.src = base64
    })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    setAnalyzing(true)

    try {
      const base64 = await readFileAsDataURL(file)
      setImagePreview(base64)

      const analysisBase64 =
        analysisMode === 'fast' ? await downscaleBase64(base64) : base64

      await analyzeImage(file, analysisBase64, analysisMode === 'enhanced')
    } catch (error) {
      console.error('处理图片失败:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const analyzeImage = async (
    file: File,
    base64: string,
    useEnhanced: boolean
  ) => {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type,
          useEnhanced,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const analysis: GeminiAnalysisResult = data.analysis
        if (analysisMode === 'assist') {
          setPendingAnalysis(analysis)
        } else {
          setFormData((prev) => ({
            ...prev,
            name: prev.name || analysis.description,
            category: analysis.category,
            colors: analysis.colors,
            season: analysis.season,
            style: analysis.style,
          }))
        }
      } else {
        console.error('AI分析失败:', data.error)
      }
    } catch (error) {
      console.error('AI分析失败:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!imageFile) {
      alert('请选择图片')
      return
    }

    setLoading(true)

    try {
      // 1. 上传图片到OSS
      const uploadFormData = new FormData()
      uploadFormData.append('file', imageFile)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const uploadData = await uploadResponse.json()

      if (!uploadData.success) {
        alert(uploadData.error || '图片上传失败')
        return
      }

      // 2. 创建衣服记录
      const createResponse = await fetch('/api/clothes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          imageUrl: uploadData.imageUrl,
          thumbnail: uploadData.thumbnail,
        }),
      })

      const createData = await createResponse.json()

      if (createData.success) {
        alert('添加成功！')
        router.push('/clothes')
      } else {
        alert(createData.error || '添加失败')
      }
    } catch (error) {
      console.error('添加失败:', error)
      alert('添加失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const applyPendingAnalysis = () => {
    if (!pendingAnalysis) return
    setFormData((prev) => ({
      ...prev,
      name: prev.name || pendingAnalysis.description,
      category: pendingAnalysis.category,
      colors: pendingAnalysis.colors,
      season: pendingAnalysis.season,
      style: pendingAnalysis.style,
    }))
    setPendingAnalysis(null)
  }

  const toggleArrayItem = (
    field: 'colors' | 'season' | 'style',
    value: string
  ) => {
    setFormData((prev) => {
      const array = prev[field]
      const newArray = array.includes(value)
        ? array.filter((item) => item !== value)
        : [...array, value]
      return { ...prev, [field]: newArray }
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">添加衣服</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 图片上传 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <label className="block text-sm font-medium text-gray-900">
              上传照片
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAnalysisMode('fast')}
                disabled={analyzing}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  analysisMode === 'fast'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                快速识别
              </button>
              <button
                type="button"
                onClick={() => setAnalysisMode('assist')}
                disabled={analyzing}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  analysisMode === 'assist'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                半自动
              </button>
              <button
                type="button"
                onClick={() => setAnalysisMode('enhanced')}
                disabled={analyzing}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  analysisMode === 'enhanced'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                精准识别
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            快速识别更快，精准识别更细致。
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
            required
            disabled={analyzing}
          />
          {imagePreview && (
            <div className="relative w-full aspect-square max-w-sm mx-auto border rounded-lg overflow-hidden">
              <Image
                src={imagePreview}
                alt="预览"
                fill
                className="object-cover"
              />
              {analyzing && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                  <div className="h-10 w-10 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  <p className="text-white font-medium text-lg">AI 识别中...</p>
                  <p className="text-white text-sm">
                    {analysisSteps[analysisStep]}
                  </p>
                </div>
              )}
            </div>
          )}
          {analysisMode === 'assist' && pendingAnalysis && (
            <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-2">
              <div className="text-sm font-medium text-gray-900">
                半自动建议已生成
              </div>
              <div className="text-xs text-gray-600">
                {pendingAnalysis.description}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="px-2 py-1 bg-gray-100 rounded">
                  类别：{pendingAnalysis.category}
                </span>
                {pendingAnalysis.colors.map((color) => (
                  <span key={color} className="px-2 py-1 bg-gray-100 rounded">
                    {color}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={applyPendingAnalysis}
                  className="px-3 py-1 text-xs bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  一键填入
                </button>
                <button
                  type="button"
                  onClick={() => setPendingAnalysis(null)}
                  className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  忽略
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 名称 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">名称</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            required
          />
        </div>

        {/* 类别 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">类别</label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({
                ...formData,
                category: e.target.value as Category,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="top">上装</option>
            <option value="bottom">下装</option>
            <option value="outerwear">外套</option>
            <option value="shoes">鞋子</option>
            <option value="accessory">配饰</option>
          </select>
        </div>

        {/* 颜色 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            颜色（可多选）
          </label>
          <div className="flex flex-wrap gap-2">
            {['red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'brown', 'pink'].map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => toggleArrayItem('colors', color)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  formData.colors.includes(color)
                    ? 'bg-black text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* 季节 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            适合季节（可多选）
          </label>
          <div className="flex flex-wrap gap-2">
            {['spring', 'summer', 'fall', 'winter'].map((season) => (
              <button
                key={season}
                type="button"
                onClick={() => toggleArrayItem('season', season)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  formData.season.includes(season)
                    ? 'bg-black text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {season}
              </button>
            ))}
          </div>
        </div>

        {/* 风格 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            风格（可多选）
          </label>
          <div className="flex flex-wrap gap-2">
            {['casual', 'formal', 'sport', 'elegant'].map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => toggleArrayItem('style', style)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  formData.style.includes(style)
                    ? 'bg-black text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* 品牌（可选） */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            品牌 <span className="text-gray-500 text-xs">(可选)</span>
          </label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            placeholder="例如：Uniqlo, Zara, Nike"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>

        {/* 价格（可选） */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            价格 <span className="text-gray-500 text-xs">(可选，单位：元)</span>
          </label>
          <input
            type="number"
            value={formData.price || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                price: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="例如：299"
            min="0"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading || analyzing}
            className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '添加中...' : '添加'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NewClothingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">添加衣服</h1>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-500">页面加载中...</p>
          </div>
        </div>
      }
    >
      <NewClothingForm />
    </Suspense>
  )
}
