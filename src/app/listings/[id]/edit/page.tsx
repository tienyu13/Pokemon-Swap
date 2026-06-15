'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [form, setForm] = useState({
    card_name: '',
    set_name: '',
    condition: 'NM',
    rarity: '',
    wants: '',
    user_name: '',
  })
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedPreview, setUploadedPreview] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }

      const { data: listing } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('user_id', data.user.id)
        .single()

      if (!listing) { router.push('/listings/my'); return }

      setForm({
        card_name: listing.card_name ?? '',
        set_name: listing.set_name ?? '',
        condition: listing.condition ?? 'NM',
        rarity: listing.rarity ?? '',
        wants: listing.wants ?? '',
        user_name: listing.user_name ?? '',
      })
      setCurrentImageUrl(listing.image_url ?? '')
      setLoading(false)
    })
  }, [id, router])

  useEffect(() => {
    return () => {
      if (uploadedPreview) URL.revokeObjectURL(uploadedPreview)
    }
  }, [uploadedPreview])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('')
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('請上傳圖片檔案')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('檔案大小不能超過 10MB')
      return
    }
    if (uploadedPreview) URL.revokeObjectURL(uploadedPreview)
    setUploadedFile(file)
    setUploadedPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    let finalImageUrl = currentImageUrl

    if (uploadedFile) {
      const fileExt = uploadedFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { error: storageError } = await supabase.storage
        .from('card-images')
        .upload(fileName, uploadedFile)

      if (storageError) {
        setError('圖片上傳失敗：' + storageError.message)
        setSaving(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('card-images')
        .getPublicUrl(fileName)
      finalImageUrl = urlData.publicUrl
    }

    const { error } = await supabase
      .from('listings')
      .update({ ...form, image_url: finalImageUrl })
      .eq('id', id)

    setSaving(false)
    if (error) setError(error.message)
    else setSuccess(true)
  }

  if (loading) return null

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">修改成功！</h2>
            <div className="flex gap-3 justify-center mt-6">
              <button onClick={() => router.push('/listings/my')} className="px-5 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">
                回我的上架
              </button>
              <button onClick={() => router.push(`/listings/${id}`)} className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50">
                查看卡片
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-lg mx-auto py-12 px-6">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← 返回</button>
          <h2 className="text-2xl font-bold text-gray-900">修改上架資料</h2>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">卡片名稱</label>
            <input
              type="text"
              value={form.card_name}
              onChange={e => setForm({ ...form, card_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-black focus:outline-none focus:border-red-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">卡片圖片</label>
            {(uploadedPreview || currentImageUrl) && (
              <div className="mb-3 flex items-center gap-3">
                <img
                  src={uploadedPreview || currentImageUrl}
                  alt="預覽"
                  className="w-20 rounded-lg border border-gray-200"
                />
                {uploadedPreview && (
                  <button
                    onClick={() => { URL.revokeObjectURL(uploadedPreview); setUploadedFile(null); setUploadedPreview('') }}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    取消換圖
                  </button>
                )}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            <p className="text-xs text-gray-400 mt-1">不換圖片就不用選</p>
            {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">系列名稱</label>
            <input
              type="text"
              value={form.set_name}
              onChange={e => setForm({ ...form, set_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-black focus:outline-none focus:border-red-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">稀有等級</label>
            <select
              value={form.rarity}
              onChange={e => setForm({ ...form, rarity: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-black focus:outline-none focus:border-red-400"
            >
              <option value="">請選擇（選填）</option>
              <option value="C">C（Common）</option>
              <option value="U">U（Uncommon）</option>
              <option value="R">R（Rare）</option>
              <option value="RR">RR（Double Rare）</option>
              <option value="AR">AR（Art Rare）</option>
              <option value="SR">SR（Super Rare）</option>
              <option value="SAR">SAR（Special Art Rare）</option>
              <option value="UR">UR（Ultra Rare）</option>
              <option value="HR">HR（Hyper Rare）</option>
              <option value="PR">PR（Promo）</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">品相</label>
            <select
              value={form.condition}
              onChange={e => setForm({ ...form, condition: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-black focus:outline-none focus:border-red-400"
            >
              <option value="NM">NM（近全新）</option>
              <option value="LP">LP（輕微使用）</option>
              <option value="MP">MP（中度使用）</option>
              <option value="HP">HP（重度使用）</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">想換的卡</label>
            <input
              type="text"
              value={form.wants}
              onChange={e => setForm({ ...form, wants: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-black focus:outline-none focus:border-red-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">你的名稱</label>
            <input
              type="text"
              value={form.user_name}
              onChange={e => setForm({ ...form, user_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-black focus:outline-none focus:border-red-400"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving || !form.card_name || !form.wants || !form.user_name}
            className="w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '儲存中...' : '儲存修改'}
          </button>
        </div>
      </div>
    </main>
  )
}
