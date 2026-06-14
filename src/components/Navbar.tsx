'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <a href="/" className="text-xl font-bold text-red-500">PokeSwap 台灣</a>
        {user && (
          <>
            <a href="/listings/my" className="text-sm text-gray-600 hover:text-gray-900">我的上架</a>
            <a href="/listings/interested" className="text-sm text-gray-600 hover:text-gray-900">有興趣的人</a>
            <a href="/listings/my-proposals" className="text-sm text-gray-600 hover:text-gray-900">我的提議</a>
          </>
        )}
      </div>
      <div className="flex gap-3 items-center">
        {user ? (
          <>
            <span className="text-sm text-gray-600 hidden md:block">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              登出
            </button>
          </>
        ) : (
          <>
            <a href="/login" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">登入</a>
            <a href="/login" className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">註冊</a>
          </>
        )}
      </div>
    </nav>
  )
}