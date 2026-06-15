'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewListing() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({
    card_name: '',
    set_name: '',
    condition: 'NM',
    rarity: '',
    wants: '',
    user_name: '',
  })

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedPreview, setUploadedPreview] = useState('')
  const [uploadError, setUploadError] = useState('')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login')
      } else {
        setUserId(data.user.id)
        const savedName = localStorage.getItem('pokeswap_user_name')
        if (savedName) setForm(f => ({ ...f, user_name: savedName }))
      }
    })
  }, [router])

  useEffect(() => {
    return () => {
      if (uploadedPreview) URL.revokeObjectURL(uploadedPreview)
    }
  }, [uploadedPreview])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('')
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setUploadError('只接受 JPG 或 PNG 格式')
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

  const handleSubmit = async () => {
    if (!userId) return
    setLoading(true)
    setError('')

    let finalImageUrl = ''

    if (uploadedFile) {
      const fileExt = uploadedFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`

      const { error: storageError } = await supabase.storage
        .from('card-images')
        .upload(fileName, uploadedFile)

      if (storageError) {
        setError('圖片上傳失敗：' + storageError.message)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('card-images')
        .getPublicUrl(fileName)

      finalImageUrl = urlData.publicUrl
    }

    const { error } = await supabase.from('listings').insert([{
      ...form,
      user_id: userId,
      image_url: finalImageUrl,
    }])

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      localStorage.setItem('pokeswap_user_name', form.user_name)
      setSuccess(true)
    }
  }

  if (!userId) return null

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
            <h2 className="text-xl font-bold text-gray-900 mb-2">上架成功！</h2>
            <p className="text-gray-500 mb-6">你的卡片已經上架，等待配對中。</p>
            <a href="/" className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 inline-block">
              回首頁
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-lg mx-auto py-12 px-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">上架我的卡片</h2>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">卡片名稱</label>
            <input
              type="text"
              placeholder="例：Charizard、甲賀忍蛙"
              value={form.card_name}
              onChange={(e) => setForm({ ...form, card_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-black focus:outline-none focus:border-red-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">上傳卡片照片</label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            <p className="text-xs text-gray-400 mt-1">JPG / PNG，最大 10MB</p>
            {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
            {uploadedPreview && (
              <div className="mt-3 flex items-center gap-3">
                <img src={uploadedPreview} alt="預覽" className="w-20 rounded-lg border border-gray-200" />
                <button
                  onClick={() => {
                    if (uploadedPreview) URL.revokeObjectURL(uploadedPreview)
                    setUploadedFile(null)
                    setUploadedPreview('')
                  }}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  取消
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">系列名稱</label>
            <input
              type="text"
              placeholder="例：黑焰支配者"
              value={form.set_name}
              onChange={(e) => setForm({ ...form, set_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-black focus:outline-none focus:border-red-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">稀有等級</label>
            <select
              value={form.rarity}
              onChange={(e) => setForm({ ...form, rarity: e.target.value })}
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
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
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
              placeholder="例：皮卡丘 ex"
              value={form.wants}
              onChange={(e) => setForm({ ...form, wants: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-black focus:outline-none focus:border-red-400"
            />
            <p className="text-xs text-gray-400 mt-1">不確定想換什麼？可以填「私聊討論」</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">你的名稱</label>
            <input
              type="text"
              placeholder="例：Rick"
              value={form.user_name}
              onChange={(e) => setForm({ ...form, user_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-black focus:outline-none focus:border-red-400"
            />
            <p className="text-xs text-gray-400 mt-1">可在名稱後加上聯絡方式，例：Rick・IG @rick 或 Line: rick123</p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || !form.card_name || !form.wants || !form.user_name}
            className="w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '上架中...' : '確認上架'}
          </button>

        </div>
      </div>
    </main>
  )
}
