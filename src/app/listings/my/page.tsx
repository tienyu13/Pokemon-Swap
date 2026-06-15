'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

export default function MyListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login')
        return
      }
      setUserId(data.user.id)
      supabase
        .from('listings')
        .select('*')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })
        .then(({ data: listings }) => {
          setListings(listings ?? [])
          setLoading(false)
        })
    })
  }, [router])

  const handleDelete = async (id: string) => {
    if (!confirm('確定要下架這張卡片嗎？')) return
    setDeletingId(id)
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (!error) {
      setListings(prev => prev.filter(l => l.id !== id))
    }
    setDeletingId(null)
  }

  if (loading) return null

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto py-12 px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">我的上架</h2>
          <a href="/listings/new" className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg font-medium hover:bg-red-600">
            新增上架
          </a>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-2xl font-bold text-gray-700">還沒有上架任何卡片</p>
            <a href="/listings/new" className="mt-4 inline-block px-6 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
              上架第一張
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex gap-4 items-center">
                {listing.image_url ? (
                  <img src={listing.image_url} alt={listing.card_name} className="w-16 rounded-xl flex-shrink-0" />
                ) : (
                  <div className="bg-gray-100 rounded-xl w-16 h-20 flex items-center justify-center text-3xl flex-shrink-0">🃏</div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{listing.card_name}</p>
                  {listing.set_name && <p className="text-sm text-gray-400">{listing.set_name}</p>}
                  <div className="flex gap-2 mt-1 items-center">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{listing.condition}</span>
                    <span className="text-sm text-gray-500">想換：{listing.wants}</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <a
                    href={`/listings/${listing.id}/edit`}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    修改
                  </a>
                  <button
                    onClick={() => handleDelete(listing.id)}
                    disabled={deletingId === listing.id}
                    className="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === listing.id ? '下架中...' : '下架'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
