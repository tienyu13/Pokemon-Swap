'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [proposalBadge, setProposalBadge] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) fetchBadges(data.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchBadges(session.user.id)
      else { setPendingCount(0); setProposalBadge(0) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchBadges = async (userId: string) => {
    // 有興趣的人：我的上架收到的待處理提議
    const { data: myListings } = await supabase
      .from('listings')
      .select('id')
      .eq('user_id', userId)

    if (myListings && myListings.length > 0) {
      const ids = myListings.map((l: any) => l.id)
      const { count } = await supabase
        .from('trade_proposals')
        .select('id', { count: 'exact', head: true })
        .in('listing_id', ids)
        .eq('status', 'pending')
      setPendingCount(count ?? 0)
    }

    // 我的提議：對方已回應但我還沒看
    const { count: unseenCount } = await supabase
      .from('trade_proposals')
      .select('id', { count: 'exact', head: true })
      .eq('proposer_id', userId)
      .eq('proposer_seen', false)
    setProposalBadge(unseenCount ?? 0)
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <a href="/" className="text-xl font-bold text-red-500">PokeSwap 台灣</a>
        {user && (
          <>
            <a href="/listings/my" className="text-sm text-gray-600 hover:text-gray-900">我的上架</a>
            <a href="/listings/interested" className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1">
              有興趣的人
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </a>
            <a href="/listings/my-proposals" className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1">
              我的提議
              {proposalBadge > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {proposalBadge > 9 ? '9+' : proposalBadge}
                </span>
              )}
            </a>
          </>
        )}
      </div>
      <div className="flex gap-3 items-center">
        {user ? (
          <a href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
              {user.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-sm text-gray-600 hidden md:block">{user.email}</span>
          </a>
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
