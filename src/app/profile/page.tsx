'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [sentProposals, setSentProposals] = useState<any[]>([])
  const [acceptedProposals, setAcceptedProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)

      const [listingsRes, sentRes] = await Promise.all([
        supabase.from('listings').select('*').eq('user_id', data.user.id).order('created_at', { ascending: false }),
        supabase.from('trade_proposals').select('*, listings(card_name, image_url)').eq('proposer_id', data.user.id).order('created_at', { ascending: false }),
      ])

      setListings(listingsRes.data ?? [])
      const sent = sentRes.data ?? []
      setSentProposals(sent.filter((p: any) => p.status !== 'accepted'))
      setAcceptedProposals(sent.filter((p: any) => p.status === 'accepted'))
      setLoading(false)
    })
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return null

  const initials = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto py-10 px-6">

        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-5 mb-6">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-lg truncate">{user?.email}</p>
            <p className="text-sm text-gray-400 mt-0.5">上架 {listings.length} 張 · 提議 {sentProposals.length + acceptedProposals.length} 次</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex-shrink-0"
          >
            登出
          </button>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <a href="/listings/new" className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:border-red-300 transition-colors">
            <div className="text-2xl mb-1">📤</div>
            <p className="text-xs font-medium text-gray-700">上架卡片</p>
          </a>
          <a href="/listings/interested" className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:border-red-300 transition-colors">
            <div className="text-2xl mb-1">📬</div>
            <p className="text-xs font-medium text-gray-700">有興趣的人</p>
          </a>
          <a href="/listings/my-proposals" className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:border-red-300 transition-colors">
            <div className="text-2xl mb-1">📨</div>
            <p className="text-xs font-medium text-gray-700">我的提議</p>
          </a>
        </div>

        {/* My listings */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">我的上架</h3>
            <a href="/listings/my" className="text-xs text-red-500 hover:underline">查看全部</a>
          </div>
          {listings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
              還沒有上架任何卡片
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {listings.slice(0, 6).map(l => (
                <a key={l.id} href={`/listings/${l.id}`} className="flex-shrink-0 w-24">
                  {l.image_url ? (
                    <img src={l.image_url} alt={l.card_name} className="w-24 rounded-xl shadow-sm" />
                  ) : (
                    <div className="w-24 h-32 bg-gray-100 rounded-xl flex items-center justify-center text-3xl">🃏</div>
                  )}
                  <p className="text-xs text-gray-600 mt-1 truncate">{l.card_name}</p>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Accepted / trade history */}
        {acceptedProposals.length > 0 && (
          <section className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3">交換歷史</h3>
            <div className="flex flex-col gap-3">
              {acceptedProposals.map((p: any) => (
                <div key={p.id} className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
                  {p.listings?.image_url ? (
                    <img src={p.listings.image_url} alt={p.listings.card_name} className="w-12 rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">🃏</div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.listings?.card_name ?? '卡片'}</p>
                    <p className="text-xs text-green-600 mt-0.5">已接受交換</p>
                    {p.message && <p className="text-xs text-gray-500 mt-0.5">{p.message}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  )
}
