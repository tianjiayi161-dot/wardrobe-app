'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { PageHeader } from '@/components/PageHeader'

export default function AccountPage() {
  const { user, refetch } = useAuth()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setAvatar(user.avatar || '')
    }
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="账号管理" />

      <div className="px-4 space-y-6 pb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">基础信息</h2>
          <div className="space-y-2">
            <label className="text-sm text-gray-600">昵称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-600">头像 URL</label>
            <input
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-600">上传头像</label>
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm"
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
            {uploading && (
              <p className="text-xs text-gray-500">头像上传中…</p>
            )}
            {avatar && (
              <img
                src={avatar}
                alt="头像预览"
                className="w-16 h-16 rounded-full object-cover border border-gray-200"
              />
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
                  body: JSON.stringify({ name, avatar }),
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

        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">修改密码</h2>
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
          <button
            type="button"
            disabled={savingPwd}
            onClick={async () => {
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
      </div>
    </div>
  )
}
