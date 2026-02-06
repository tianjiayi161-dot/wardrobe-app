'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { KeyRound, LogOut, Pencil } from 'lucide-react'

export default function AccountPage() {
  const { user, refetch } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [bio, setBio] = useState('')
  const [vibeTags, setVibeTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const profileRef = useRef<HTMLDivElement | null>(null)
  const securityRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [stats, setStats] = useState({
    totalItems: 0,
    mostWornColor: '—',
    outfitsCreated: 0,
  })

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setAvatar(user.avatar || '')
      setBio(user.bio || '')
      setVibeTags(user.vibeTags || [])
    }
  }, [user])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuOpen) return
      const target = e.target as Node
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [menuOpen])

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [clothesRes, outfitsRes] = await Promise.all([
          fetch('/api/clothes'),
          fetch('/api/outfits'),
        ])
        const clothesData = await clothesRes.json()
        const outfitsData = await outfitsRes.json()
        const clothes = clothesData.clothes || []
        const outfits = outfitsData.outfits || []

        const colorCounts: Record<string, number> = {}
        for (const item of clothes) {
          for (const color of item.colors || []) {
            colorCounts[color] = (colorCounts[color] || 0) + 1
          }
        }
        const mostWornColor =
          Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

        setStats({
          totalItems: clothes.length,
          mostWornColor,
          outfitsCreated: outfits.length,
        })
      } catch (error) {
        console.error('加载统计失败:', error)
      }
    }
    loadStats()
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved) {
      document.documentElement.classList.toggle('dark', saved === 'dark')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-black">用户资料</div>
          <div className="relative z-50" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <span className="text-sm text-gray-700">{name || '用户'}</span>
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50"
              >
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    setMenuOpen(false)
                    profileRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <Pencil size={16} />
                  Edit Profile
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    setMenuOpen(false)
                    setShowPasswordForm(true)
                    securityRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <KeyRound size={16} />
                  Change Password
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                  onClick={async () => {
                    setMenuOpen(false)
                    await fetch('/api/auth/logout', { method: 'POST' })
                    localStorage.clear()
                    router.push('/login')
                  }}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6 pb-8">
        <div ref={profileRef} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div>
              <div className="text-xl font-semibold text-black">{name || '用户'}</div>
              <div className="text-sm text-gray-500">{bio || 'Exploring my daily vibe'}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {vibeTags.length > 0 ? (
              vibeTags.map((tag) => (
                <span key={tag} className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-700">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">暂无 Vibe Style 标签</span>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500">Total Items</div>
            <div className="text-xl font-semibold text-black">{stats.totalItems}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Most Worn Color</div>
            <div className="text-xl font-semibold text-black">{stats.mostWornColor}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Outfits Created</div>
            <div className="text-xl font-semibold text-black">{stats.outfitsCreated}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">System Settings</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Calendar Sync</span>
            <input type="checkbox" className="h-5 w-5" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Theme Mode</span>
            <button
              type="button"
              className="px-3 py-1 rounded-full border text-sm"
              onClick={() => {
                const root = document.documentElement
                root.classList.toggle('dark')
                localStorage.setItem('theme', root.classList.contains('dark') ? 'dark' : 'light')
              }}
            >
              Toggle
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <Link
            href="/clothes/new"
            className="inline-flex items-center justify-center w-full px-4 py-3 rounded-lg text-white bg-[color:var(--brand)] font-semibold"
          >
            Upload New Clothing
          </Link>
        </div>

        <div ref={profileRef} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Edit Profile</h2>
          <div className="space-y-2">
            <label className="text-sm text-gray-600">昵称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-600">个性签名</label>
            <input
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Vibe Style 标签</label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="如：Minimalist"
              />
              <button
                type="button"
                className="px-3 py-2 border rounded-md"
                onClick={() => {
                  const t = tagInput.trim()
                  if (!t) return
                  if (!vibeTags.includes(t)) {
                    setVibeTags((prev) => [...prev, t])
                  }
                  setTagInput('')
                }}
              >
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {vibeTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setVibeTags((prev) => prev.filter((t) => t !== tag))}
                  className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-700"
                >
                  {tag} ×
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-600">头像</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                {avatar ? (
                  <img src={avatar} alt="头像预览" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploading(true)
                    try {
                      const formData = new FormData()
                      formData.append('file', file)
                      const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                      })
                      const data = await res.json()
                      if (!data.success) {
                        alert(data.error || '上传失败')
                        return
                      }
                      setAvatar(data.imageUrl)
                    } catch (error) {
                      console.error('上传失败:', error)
                      alert('上传失败，请稍后重试')
                    } finally {
                      setUploading(false)
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  Upload
                </button>
              </div>
            </div>
            {uploading && (
              <p className="text-xs text-gray-500">头像上传中…</p>
            )}
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true)
              try {
                const res = await fetch('/api/auth/profile', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, avatar, bio, vibeTags }),
                })
                const data = await res.json()
                if (!data.success) {
                  alert(data.error || '保存失败')
                  return
                }
                await refetch()
                alert('已更新')
              } catch (error) {
                console.error('保存失败:', error)
                alert('保存失败，请稍后重试')
              } finally {
                setSaving(false)
              }
            }}
            className="w-full px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400"
          >
            {saving ? '保存中...' : '保存资料'}
          </button>
        </div>

        {showPasswordForm && (
          <div ref={securityRef} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Change Password</h2>
            <div className="space-y-2">
              <label className="text-sm text-gray-600">当前密码</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-600">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-600">确认新密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              type="button"
              disabled={savingPwd}
              onClick={async () => {
                if (!newPassword || newPassword !== confirmPassword) {
                  alert('新密码与确认密码不一致')
                  return
                }
                setSavingPwd(true)
                try {
                  const res = await fetch('/api/auth/password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword, newPassword }),
                  })
                  const data = await res.json()
                  if (!data.success) {
                    alert(data.error || '修改失败')
                    return
                  }
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setShowPasswordForm(false)
                  alert('密码已更新')
                } catch (error) {
                  console.error('修改失败:', error)
                  alert('修改失败，请稍后重试')
                } finally {
                  setSavingPwd(false)
                }
              }}
              className="w-full px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400"
            >
              {savingPwd ? '保存中...' : '修改密码'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
