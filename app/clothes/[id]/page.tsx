'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Clothing } from '@/types'
import { categoryMap, colorMap, seasonMap, styleMap } from '@/lib/utils'

export default function ClothingDetailPage() {
  const params = useParams()
  const [clothing, setClothing] = useState<Clothing | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    brand: '',
    price: '',
    colors: '',
    wearCount: '',
    subcategory: '',
    material: '',
    tags: '',
  })

  useEffect(() => {
    if (params.id) {
      fetchClothing(params.id as string)
    }
  }, [params.id])

  const fetchClothing = async (id: string) => {
    try {
      const response = await fetch(`/api/clothes/${id}`)
      const data = await response.json()
      if (data.success) {
        setClothing(data.clothing)
        setForm({
          name: data.clothing.name || '',
          brand: data.clothing.brand || '',
          price: data.clothing.price?.toString() || '',
          colors: (data.clothing.colors || []).join(', '),
          wearCount: data.clothing.wearCount?.toString() || '0',
          subcategory: data.clothing.subcategory || '',
          material: data.clothing.material || '',
          tags: (data.clothing.tags || []).join(', '),
        })
      } else {
        alert(data.error || '获取衣服详情失败')
      }
    } catch (error) {
      console.error('获取衣服详情失败:', error)
      alert('获取衣服详情失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  if (!clothing) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">衣服不存在</p>
        <Link href="/clothes" className="text-blue-600 hover:underline">
          返回衣橱
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Link
          href="/clothes"
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← 返回衣橱
        </Link>
        <button
          type="button"
          onClick={() => setEditing((prev) => !prev)}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {editing ? '取消编辑' : '编辑'}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-50">
          <Image
            src={clothing.imageUrl}
            alt={clothing.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="space-y-2">
          {!editing ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900">{clothing.name}</h1>
              <p className="text-sm text-gray-600">
                {categoryMap[clothing.category] || clothing.category}
              </p>
              <p className="text-sm text-gray-500">
                穿着次数：{clothing.wearCount} 次
              </p>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-600">名称</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">品牌</label>
                <input
                  value={form.brand}
                  onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">价格</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">颜色（逗号分隔）</label>
                <input
                  value={form.colors}
                  onChange={(e) => setForm((prev) => ({ ...prev, colors: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">穿着次数</label>
                <input
                  type="number"
                  value={form.wearCount}
                  onChange={(e) => setForm((prev) => ({ ...prev, wearCount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">细分品类</label>
                <input
                  value={form.subcategory}
                  onChange={(e) => setForm((prev) => ({ ...prev, subcategory: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">材质</label>
                <input
                  value={form.material}
                  onChange={(e) => setForm((prev) => ({ ...prev, material: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-gray-600">标签（逗号分隔）</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    if (!clothing) return
                    setSaving(true)
                    try {
                      const payload = {
                        name: form.name.trim(),
                        brand: form.brand.trim() || undefined,
                        price: form.price ? Number(form.price) : undefined,
                        colors: form.colors
                          .split(/[,，]/)
                          .map((c) => c.trim())
                          .filter(Boolean),
                        wearCount: form.wearCount ? Number(form.wearCount) : 0,
                        subcategory: form.subcategory.trim() || undefined,
                        material: form.material.trim() || undefined,
                        tags: form.tags
                          .split(/[,，]/)
                          .map((t) => t.trim())
                          .filter(Boolean),
                      }
                      const res = await fetch(`/api/clothes/${clothing._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                      })
                      const data = await res.json()
                      if (!data.success) {
                        alert(data.error || '保存失败')
                        return
                      }
                      setClothing(data.clothing)
                      setEditing(false)
                    } catch (error) {
                      console.error('保存失败:', error)
                      alert('保存失败，请稍后重试')
                    } finally {
                      setSaving(false)
                    }
                  }}
                  className="w-full px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400"
                >
                  {saving ? '保存中...' : '保存修改'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="text-gray-500">颜色</div>
            <div className="text-gray-900">
              {(clothing.colors || []).map((c) => colorMap[c] || c).join(' / ') || '—'}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-gray-500">季节</div>
            <div className="text-gray-900">
              {(clothing.season || []).map((s) => seasonMap[s] || s).join(' / ') || '—'}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-gray-500">风格</div>
            <div className="text-gray-900">
              {(clothing.style || []).map((s) => styleMap[s] || s).join(' / ') || '—'}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-gray-500">品牌</div>
            <div className="text-gray-900">{clothing.brand || '—'}</div>
          </div>
          <div className="space-y-2">
            <div className="text-gray-500">细分品类</div>
            <div className="text-gray-900">{clothing.subcategory || '—'}</div>
          </div>
          <div className="space-y-2">
            <div className="text-gray-500">材质</div>
            <div className="text-gray-900">{clothing.material || '—'}</div>
          </div>
          <div className="space-y-2 col-span-2">
            <div className="text-gray-500">标签</div>
            <div className="text-gray-900">
              {(clothing.tags || []).join(' / ') || '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
