'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { GeminiAnalysisResult } from '@/types'

export default function NewClothingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    category: 'top' as const,
    colors: [] as string[],
    season: [] as string[],
    style: [] as string[],
    imageUrl: '',
    thumbnail: '',
    tags: [] as string[],
  })

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)

    // 生成预览
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // 自动触发AI分析
    analyzeImage(file)
  }

  const analyzeImage = async (file: File) => {
    setAnalyzing(true)

    try {
      // 转换为base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string

        // 调用分析API
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type,
          }),
        })

        const data = await response.json()

        if (data.success) {
          const analysis: GeminiAnalysisResult = data.analysis
          setFormData((prev) => ({
            ...prev,
            name: prev.name || analysis.description,
            category: analysis.category,
            colors: analysis.colors,
            season: analysis.season,
            style: analysis.style,
          }))
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('AI分析失败:', error)
    } finally {
      setAnalyzing(false)
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

  const toggleArrayItem = (field: 'colors' | 'season' | 'style', value: string) => {
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
          <label className="block text-sm font-medium text-gray-900">
            上传照片
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
            required
          />
          {analyzing && (
            <p className="text-sm text-blue-600">AI 识别中...</p>
          )}
          {imagePreview && (
            <div className="relative w-full aspect-square max-w-sm mx-auto border rounded-lg overflow-hidden">
              <Image
                src={imagePreview}
                alt="预览"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>

        {/* 名称 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            名称
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            required
          />
        </div>

        {/* 类别 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            类别
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({
                ...formData,
                category: e.target.value as any,
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
