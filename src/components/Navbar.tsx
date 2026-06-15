'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [proposalBadge, setProposalBadge] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const userIdRef = useRef<string | null>(null)

  const fetchBadges = async (userId: string) => {
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
    } else {
      setPendingCount(0)
    }

    const { count: unseenCount } = await supabase
      .from('trade_proposals')
      .select('id', { count: 'exact', head: true })
      .eq('proposer_id', userId)
      .eq('proposer_seen', false)
    setProposalBadge(unseenCount ?? 0)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        userIdRef.current = data.user.id
        fetchBadges(data.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        userIdRef.current = session.user.id
        fetchBadges(session.user.id)
      } else {
        userIdRef.current = null
        setPendingCount(0)
        setProposalBadge(0)
      }
    })

    const channel = supabase
      .channel('trade-proposals-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trade_proposals' },
        () => {
          if (userIdRef.current) fetchBadges(userIdRef.current)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="text-xl font-bold text-red-500">PokeSwap 台灣</a>

          {/* Desktop links */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
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
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <a href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {user.email?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="text-sm text-gray-600 hidden md:block">{user.email}</span>
            </a>
          ) : (
            <a href="/login" className="hidden md:block px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">登入</a>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden flex flex-col gap-1.5 p-2"
          >
            <span className={`block w-5 h-0.5 bg-gray-600 transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-600 transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-600 transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 px-6 py-4 flex flex-col gap-4 bg-white">
          {user ? (
            <>
              <a href="/profile" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {user.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="text-sm text-gray-700 truncate">{user.email}</span>
              </a>
              <hr className="border-gray-100" />
              <a href="/listings/my" className="text-sm text-gray-700 py-1" onClick={() => setMenuOpen(false)}>我的上架</a>
              <a href="/listings/interested" className="text-sm text-gray-700 py-1 flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                有興趣的人
                {pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full">{pendingCount}</span>
                )}
              </a>
              <a href="/listings/my-proposals" className="text-sm text-gray-700 py-1 flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                我的提議
                {proposalBadge > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full">{proposalBadge}</span>
                )}
              </a>
              <a href="/listings/new" className="text-sm text-gray-700 py-1" onClick={() => setMenuOpen(false)}>上架卡片</a>
              <a href="/search" className="text-sm text-gray-700 py-1" onClick={() => setMenuOpen(false)}>搜尋卡片</a>
            </>
          ) : (
            <a href="/login" className="text-sm font-medium text-red-500 py-1" onClick={() => setMenuOpen(false)}>登入</a>
          )}
        </div>
      )}
    </nav>
  )
}
