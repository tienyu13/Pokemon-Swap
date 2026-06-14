'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('兩次密碼不一致')
      return
    }
    if (password.length < 6) {
      setError('密碼至少需要 6 個字元')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <Link href="/" className="text-2xl font-bold text-red-500 mb-8">PokeSwap 台灣</Link>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-md text-center">
          <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">密碼已重設！</h2>
          <p className="text-sm text-gray-500 mb-6">請用新密碼重新登入。</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
          >
            前往登入
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <Link href="/" className="text-2xl font-bold text-red-500 mb-8">PokeSwap 台灣</Link>
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-md">
        <h2 className="text-lg font-bold text-gray-900 mb-1">設定新密碼</h2>
        <p className="text-sm text-gray-500 mb-6">請輸入你的新密碼。</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密碼</label>
            <input
              type="password"
              required
              placeholder="至少 6 個字元"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">確認新密碼</label>
            <input
              type="password"
              required
              placeholder="再輸入一次"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? '更新中...' : '確認更新密碼'}
          </button>
        </form>
      </div>
    </main>
  )
}
