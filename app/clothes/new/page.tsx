'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { GeminiAnalysisResult } from '@/types'

const CATEGORY_OPTIONS = [
  'tshirt',
  'shirt',
  'knit',
  'sweatshirt',
  'camisole',
  'bottom_pants',
  'bottom_skirt',
  'dress',
  'outerwear',
  'shoes',
  'accessory',
  'set',
  'innerwear',
  'homewear',
  'sportswear',
] as const

type AnalysisMode = 'fast' | 'enhanced' | 'assist'

type Category = (typeof CATEGORY_OPTIONS)[number]
type PendingAnalysis = Omit<GeminiAnalysisResult, 'category'> & {
  category: Category
  tags?: string[]
}

type AttributeLabels = {
  category: Category
  subcategory: string
  colorsHex: string[]
  material: string
  colors: string[]
  style: string[]
  season: string[]
  description: string
}

const COLOR_MAP: Record<string, string> = {
  黑色: 'black',
  白色: 'white',
  灰色: 'gray',
  米色: 'brown',
  卡其色: 'brown',
  藏青色: 'blue',
  蓝色: 'blue',
  深蓝色: 'blue',
  浅蓝色: 'blue',
  红色: 'red',
  酒红色: 'red',
  粉色: 'pink',
  黄色: 'yellow',
  绿色: 'green',
  橙色: 'orange',
  紫色: 'purple',
  棕色: 'brown',
  black: 'black',
  white: 'white',
  gray: 'gray',
  beige: 'brown',
  khaki: 'brown',
  navy: 'blue',
  blue: 'blue',
  red: 'red',
  pink: 'pink',
  yellow: 'yellow',
  green: 'green',
  orange: 'orange',
  purple: 'purple',
  brown: 'brown',
}

const normalizeColors = (colors: string[]) => {
  const normalized = colors
    .map((color) => COLOR_MAP[color.trim().toLowerCase()] || COLOR_MAP[color.trim()] || color.toLowerCase())
    .map((color) => color.trim())
    .filter(Boolean)
  return Array.from(new Set(normalized)).slice(0, 3)
}

const buildTagsFromLabels = (labels: AttributeLabels) => {
  const tags: string[] = []
  if (labels.subcategory) tags.push(labels.subcategory)
  if (labels.material) tags.push(`材质:${labels.material}`)
  return tags
}

const mergeTags = (base: string[], extra: string[]) => {
  const set = new Set(base)
  extra.forEach((tag) => set.add(tag))
  return Array.from(set)
}

const parseTags = (value: string) =>
  value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)

function NewClothingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  const normalizeCategory = (value: string | null): Category => {
    if (value && CATEGORY_OPTIONS.includes(value as Category)) {
      return value as Category
    }
    if (value === 'top') return 'tshirt'
    if (value === 'bottom') return 'bottom_pants'
    return 'tshirt'
  }
  const initialCategory = normalizeCategory(categoryParam)

  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('fast')
  const [analysisStep, setAnalysisStep] = useState(0)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [pendingAnalysis, setPendingAnalysis] = useState<PendingAnalysis | null>(null)
  const [processedImageUrl, setProcessedImageUrl] = useState('')
  const [processedThumbnail, setProcessedThumbnail] = useState('')
  const [attributeLabels, setAttributeLabels] = useState<AttributeLabels | null>(
    null
  )
  const [aiDescription, setAiDescription] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [sourceMode, setSourceMode] = useState<'upload' | 'ai'>('upload')

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
    wearCount: 0,
    subcategory: '',
    material: '',
    colorsHex: [] as string[],
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
    setProcessedImageUrl('')
    setProcessedThumbnail('')
    setAttributeLabels(null)
    setPendingAnalysis(null)
    setAnalyzing(true)

    try {
      const base64 = await readFileAsDataURL(file)
      setImagePreview(base64)

      const processed = await processImage(file)
      if (!processed) {
        const analysisBase64 =
          analysisMode === 'fast' ? await downscaleBase64(base64) : base64
        await analyzeImage(file, analysisBase64, analysisMode === 'enhanced')
      }
    } catch (error) {
      console.error('处理图片失败:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const processImage = async (file: File) => {
    try {
      const form = new FormData()
      form.append('file', file)
      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: form,
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        console.error('抠图处理失败:', data?.error)
        return false
      }

      const labels: AttributeLabels = {
        ...data.labels,
        category: normalizeCategory(data.labels?.category || 'tshirt'),
      }
      const normalizedColors = normalizeColors(labels.colors || [])
      const tags = buildTagsFromLabels(labels)

      setProcessedImageUrl(data.imageUrl || '')
      setProcessedThumbnail(data.thumbnail || '')
      setAttributeLabels(labels)
      if (data.imageUrl) setImagePreview(data.imageUrl)

      const normalized: PendingAnalysis = {
        category: labels.category,
        colors: normalizedColors,
        season: labels.season || [],
        style: labels.style || [],
        description: labels.description || labels.subcategory || '',
        tags,
      }

      if (analysisMode === 'assist') {
        setPendingAnalysis(normalized)
      } else {
        setFormData((prev) => ({
          ...prev,
          name: prev.name || labels.subcategory || normalized.description,
          category: normalized.category,
          colors: normalized.colors,
          season: normalized.season,
          style: normalized.style,
          tags: mergeTags(prev.tags, tags),
          subcategory: prev.subcategory || labels.subcategory || '',
          material: prev.material || labels.material || '',
          colorsHex: labels.colorsHex || [],
        }))
      }

      return true
    } catch (error) {
      console.error('抠图处理失败:', error)
      return false
    }
  }

  const handleGenerateByText = async () => {
    const description = aiDescription.trim()
    if (!description) {
      alert('请先输入描述')
      return
    }
    setAiGenerating(true)
    setImageFile(null)
    setProcessedImageUrl('')
    setProcessedThumbnail('')
    setAttributeLabels(null)
    setPendingAnalysis(null)
    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        alert(data.error || '生成失败，请稍后重试')
        return
      }
      setProcessedImageUrl(data.imageUrl || '')
      setProcessedThumbnail(data.thumbnail || '')
      setImagePreview(data.imageUrl || '')
      setAiPrompt(data.prompt || '')
    } catch (error) {
      console.error('AI生成失败:', error)
      alert('AI生成失败，请稍后重试')
    } finally {
      setAiGenerating(false)
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
        const normalized: PendingAnalysis = {
          ...analysis,
          category: normalizeCategory(analysis.category),
        }
        if (analysisMode === 'assist') {
          setPendingAnalysis(normalized)
        } else {
          setFormData((prev) => ({
            ...prev,
            name: prev.name || normalized.description,
            category: normalized.category,
            colors: normalized.colors,
            season: normalized.season,
            style: normalized.style,
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

    if (!imageFile && !processedImageUrl) {
      alert('请选择图片或先生成图片')
      return
    }

    setLoading(true)

    try {
      let imageUrl = processedImageUrl
      let thumbnail = processedThumbnail

      if (!imageUrl) {
        if (!imageFile) {
          alert('请先选择图片')
          return
        }
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
        imageUrl = uploadData.imageUrl
        thumbnail = uploadData.thumbnail
      }

      // 2. 创建衣服记录
      const createResponse = await fetch('/api/clothes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          imageUrl,
          thumbnail,
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
      tags: mergeTags(prev.tags, pendingAnalysis.tags || []),
      subcategory: prev.subcategory || attributeLabels?.subcategory || '',
      material: prev.material || attributeLabels?.material || '',
      colorsHex: attributeLabels?.colorsHex || prev.colorsHex,
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
        {/* 图片来源选择 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-900">
            图片来源
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSourceMode('upload')}
              className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                sourceMode === 'upload'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              上传抠图
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('ai')}
              className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                sourceMode === 'ai'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              AI 生图
            </button>
          </div>
          <p className="text-xs text-gray-500">
            你可以在上传抠图与 AI 生图之间切换。
          </p>
        </div>

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

        {/* 文本生成 */}
        {sourceMode === 'ai' && (
          <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-900">
            描述生衣
          </label>
          <textarea
            value={aiDescription}
            onChange={(e) => setAiDescription(e.target.value)}
            placeholder="例如：一件带有小猫图案的粉色卫衣"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGenerateByText}
              disabled={aiGenerating || analyzing}
              className="px-4 py-2 text-sm font-medium rounded-md bg-black text-white hover:bg-gray-800 disabled:bg-gray-400"
            >
              {aiGenerating ? '生成中...' : 'AI 生成图片'}
            </button>
            <span className="text-xs text-gray-500">
              将自动生成白底商品图并加「衣序 AI」水印
            </span>
          </div>
          {aiPrompt && (
            <div className="text-xs text-gray-500">
              生成提示词：{aiPrompt}
            </div>
          )}
        </div>
        )}

        {/* 图片上传 */}
        {sourceMode === 'upload' && (
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
          {analysisMode === 'assist' && pendingAnalysis && (
            <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-2">
              <div className="text-sm font-medium text-gray-900">
                半自动建议已生成
              </div>
              <div className="text-xs text-gray-600">
                {pendingAnalysis.description}
              </div>
              {attributeLabels && (
                <div className="text-xs text-gray-500">
                  细分品类：{attributeLabels.subcategory || '—'} · 材质：
                  {attributeLabels.material || '—'}
                </div>
              )}
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
        )}

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
            <option value="tshirt">T恤</option>
            <option value="shirt">衬衫</option>
            <option value="knit">针织/毛衣</option>
            <option value="sweatshirt">卫衣</option>
            <option value="camisole">背心/吊带</option>
            <option value="bottom_pants">裤装</option>
            <option value="bottom_skirt">裙装</option>
            <option value="dress">连衣裙</option>
            <option value="outerwear">外套</option>
            <option value="shoes">鞋子</option>
            <option value="accessory">配饰</option>
            <option value="set">套装</option>
            <option value="innerwear">内衣</option>
            <option value="homewear">家居服</option>
            <option value="sportswear">运动服</option>
          </select>
        </div>

        {/* 细分品类 / 材质 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              细分品类
            </label>
            <input
              type="text"
              value={formData.subcategory}
              onChange={(e) =>
                setFormData({ ...formData, subcategory: e.target.value })
              }
              placeholder="如：连帽卫衣 / 直筒牛仔裤"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              材质
            </label>
            <input
              type="text"
              value={formData.material}
              onChange={(e) =>
                setFormData({ ...formData, material: e.target.value })
              }
              placeholder="如：棉 / 牛仔 / 羊毛"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
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

        {/* 标签 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            标签（可选，逗号分隔）
          </label>
          <input
            type="text"
            value={formData.tags.join(', ')}
            onChange={(e) =>
              setFormData({ ...formData, tags: parseTags(e.target.value) })
            }
            placeholder="如：通勤, 极简, 心头好"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
          />
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

        {/* 穿着次数 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            穿着次数
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="1"
              value={formData.wearCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  wearCount: Math.max(0, Number(e.target.value || 0)),
                })
              }
              className="w-28 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  wearCount: prev.wearCount + 1,
                }))
              }
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              +
            </button>
          </div>
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
