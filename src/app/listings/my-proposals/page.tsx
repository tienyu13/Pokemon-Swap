'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-2 justify-center my-3">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-3xl transition-transform hover:scale-110 ${n <= value ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function MyProposalsPage() {
  const router = useRouter()
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set())
  const [reviewModal, setReviewModal] = useState<{ proposalId: string; revieweeId: string } | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setCurrentUserId(data.user.id)

      await supabase
        .from('trade_proposals')
        .update({ proposer_seen: true })
        .eq('proposer_id', data.user.id)
        .eq('proposer_seen', false)

      const { data: props } = await supabase
        .from('trade_proposals')
        .select('*')
        .eq('proposer_id', data.user.id)
        .order('created_at', { ascending: false })

      if (!props || props.length === 0) { setLoading(false); return }

      const listingIds = [...new Set(props.map(p => p.listing_id))]
      const { data: listings } = await supabase
        .from('listings')
        .select('id, card_name, image_url, user_name, user_id')
        .in('id', listingIds)

      const listingMap = Object.fromEntries((listings ?? []).map(l => [l.id, l]))
      const mapped = props.map(p => ({ ...p, listing: listingMap[p.listing_id] ?? null }))
      setProposals(mapped)

      const acceptedIds = props.filter(p => p.status === 'accepted').map(p => p.id)
      if (acceptedIds.length > 0) {
        const { data: myReviews } = await supabase
          .from('reviews')
          .select('trade_proposal_id')
          .eq('reviewer_id', data.user.id)
          .in('trade_proposal_id', acceptedIds)
        setReviewedIds(new Set(myReviews?.map((r: any) => r.trade_proposal_id) ?? []))
      }

      setLoading(false)
    })
  }, [router])

  const handleDelete = async () => {
    if (!confirmDeleteId) return
    await supabase.from('trade_proposals').delete().eq('id', confirmDeleteId)
    setProposals(prev => prev.filter(p => p.id !== confirmDeleteId))
    setConfirmDeleteId(null)
  }

  const openReviewModal = (p: any) => {
    setRating(0)
    setComment('')
    setReviewDone(false)
    setReviewModal({ proposalId: p.id, revieweeId: p.listing?.user_id ?? '' })
  }

  const handleSubmitReview = async () => {
    if (!reviewModal || !rating || !currentUserId) return
    setReviewLoading(true)
    const reviewerName = typeof window !== 'undefined' ? (localStorage.getItem('pokeswap_user_name') ?? '') : ''
    const { error } = await supabase.from('reviews').insert([{
      trade_proposal_id: reviewModal.proposalId,
      reviewer_id: currentUserId,
      reviewee_id: reviewModal.revieweeId,
      reviewer_name: reviewerName,
      rating,
      comment,
    }])
    setReviewLoading(false)
    if (!error) {
      setReviewedIds(prev => new Set([...prev, reviewModal.proposalId]))
      setReviewDone(true)
    }
  }

  if (loading) return null

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto py-12 px-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">我的提議</h2>

        {proposals.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-2xl font-bold text-gray-700">還沒有送出任何提議</p>
            <p className="text-sm text-gray-400 mt-2">瀏覽卡片並點「提議交換」開始</p>
            <a href="/search" className="mt-4 inline-block px-6 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">瀏覽卡片</a>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {proposals.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-5">

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {p.listing?.image_url && (
                      <img src={p.listing.image_url} alt={p.listing.card_name} className="w-12 rounded-lg flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">你提議換對方的</p>
                      <p className="font-bold text-gray-900">{p.listing?.card_name ?? '已刪除的卡片'}</p>
                      {p.listing?.user_name && <p className="text-xs text-gray-400">上架者：{p.listing.user_name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      p.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {p.status === 'pending' ? '等待回應' : p.status === 'accepted' ? '已接受' : '已婉拒'}
                    </span>
                    <button
                      onClick={() => setConfirmDeleteId(p.id)}
                      className="text-2xl leading-none hover:scale-110 transition-transform"
                      title="刪除"
                    >
                      ❌
                    </button>
                  </div>
                </div>

                {p.offer_type === 'card' && p.offered_card_name && (
                  <div className="flex gap-3 items-center bg-gray-50 rounded-xl p-3 mb-3">
                    {p.offered_card_image && <img src={p.offered_card_image} alt={p.offered_card_name} className="w-10 rounded-lg flex-shrink-0" />}
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">你提議的卡片</p>
                      <p className="text-sm font-medium text-gray-800">{p.offered_card_name}</p>
                    </div>
                  </div>
                )}

                {p.offer_type === 'chat' && (
                  <div className="bg-blue-50 rounded-xl p-3 mb-3">
                    <p className="text-sm text-blue-700 font-medium">私聊討論</p>
                  </div>
                )}

                {p.message && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">你的備註</p>
                    <p className="text-sm text-gray-700">{p.message}</p>
                  </div>
                )}

                {p.status === 'accepted' && (
                  <div className="mt-3 bg-green-50 rounded-xl p-3 flex items-center justify-between gap-3">
                    <p className="text-sm text-green-700 font-medium">對方已接受！請透過備註中的聯絡方式聯繫。</p>
                    {!reviewedIds.has(p.id) ? (
                      <button
                        onClick={() => openReviewModal(p)}
                        className="flex-shrink-0 px-3 py-1.5 text-xs bg-yellow-400 text-white rounded-lg font-medium hover:bg-yellow-500 transition-colors"
                      >
                        ⭐ 評價
                      </button>
                    ) : (
                      <span className="flex-shrink-0 text-xs text-gray-400">已評價</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <p className="text-lg font-bold text-gray-900 mb-2">確認刪除？</p>
            <p className="text-sm text-gray-500 mb-6">刪除後將無法復原</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">我再想想</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">刪除</button>
            </div>
          </div>
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={() => { if (reviewDone) setReviewModal(null) }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            {reviewDone ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">⭐</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">評價已送出！</h3>
                <p className="text-sm text-gray-500 mb-4">感謝你的回饋</p>
                <button onClick={() => setReviewModal(null)} className="px-6 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">關閉</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">評價這次交換</h3>
                  <button onClick={() => setReviewModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                </div>
                <p className="text-sm text-gray-500 mb-1 text-center">給這次交換體驗評分</p>
                <StarPicker value={rating} onChange={setRating} />
                <textarea
                  rows={3}
                  placeholder="留下評語（選填）"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="mt-3 w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:border-red-400 resize-none"
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={!rating || reviewLoading}
                  className="mt-4 w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reviewLoading ? '送出中...' : '送出評價'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
