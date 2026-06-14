'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

const ZOOM = 3
const LENS_SIZE = 240

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(false)
  const [lens, setLens] = useState<{ px: number; py: number; bgX: number; bgY: number; imgW: number; imgH: number } | null>(null)
  const lightboxImgRef = useRef<HTMLImageElement>(null)
  const lightboxWrapperRef = useRef<HTMLDivElement>(null)

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Proposal modal
  const [showModal, setShowModal] = useState(false)
  const [offerType, setOfferType] = useState<'card' | 'chat'>('card')
  const [myListings, setMyListings] = useState<any[]>([])
  const [selectedCardId, setSelectedCardId] = useState('')
  const [proposalMessage, setProposalMessage] = useState('')
  const [proposalLoading, setProposalLoading] = useState(false)
  const [proposalSuccess, setProposalSuccess] = useState(false)

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data }) => setCurrentUser(data.user))
      .finally(() => setAuthLoading(false))

    supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setListing(data)
        setLoading(false)
      })
  }, [id])

  const handleLightboxMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const imgEl = lightboxImgRef.current
    const wrapperEl = lightboxWrapperRef.current
    if (!imgEl || !wrapperEl) return
    const imgRect = imgEl.getBoundingClientRect()
    const wrapperRect = wrapperEl.getBoundingClientRect()
    const px = e.clientX - wrapperRect.left
    const py = e.clientY - wrapperRect.top
    const imgX = Math.min(Math.max(e.clientX - imgRect.left, 0), imgRect.width)
    const imgY = Math.min(Math.max(e.clientY - imgRect.top, 0), imgRect.height)
    const bgX = -(imgX * ZOOM - LENS_SIZE / 2)
    const bgY = -(imgY * ZOOM - LENS_SIZE / 2)
    setLens({ px, py, bgX, bgY, imgW: imgRect.width, imgH: imgRect.height })
  }

  const handleOpenProposal = async () => {
    if (!currentUser) {
      router.push('/login')
      return
    }
    try {
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
      setMyListings(data ?? [])
    } catch {
      setMyListings([])
    }
    setOfferType('card')
    setSelectedCardId('')
    setProposalMessage('')
    setProposalSuccess(false)
    setShowModal(true)
  }

  const handleSubmitProposal = async () => {
    if (!currentUser || !listing) return
    setProposalLoading(true)
    const selectedCard = myListings.find(l => l.id === selectedCardId)
    const proposerName = myListings[0]?.user_name ?? ''

    const { error } = await supabase.from('trade_proposals').insert([{
      listing_id: listing.id,
      proposer_id: currentUser.id,
      proposer_name: proposerName,
      offer_type: offerType,
      offered_listing_id: offerType === 'card' && selectedCardId ? selectedCardId : null,
      offered_card_name: offerType === 'card' && selectedCard ? selectedCard.card_name : null,
      offered_card_image: offerType === 'card' && selectedCard ? selectedCard.image_url : null,
      message: proposalMessage,
    }])

    setProposalLoading(false)
    if (!error) setProposalSuccess(true)
  }

  const isOwnListing = currentUser && listing && currentUser.id === listing.user_id

  if (loading) return null

  if (!listing) return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto py-24 px-6 text-center text-gray-400">
        <p className="text-lg">找不到這筆上架資料</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-red-500 hover:underline">返回</button>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto py-10 px-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
          ← 返回
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex gap-8">
          <div className="flex-shrink-0">
            {listing.image_url ? (
              <img
                src={listing.image_url}
                alt={listing.card_name}
                className="w-40 rounded-xl shadow-md cursor-zoom-in hover:shadow-xl transition-shadow"
                onClick={() => { setLightbox(true); setLens(null) }}
              />
            ) : (
              <div className="bg-gray-100 rounded-xl w-40 h-56 flex items-center justify-center text-6xl">🃏</div>
            )}
          </div>

          {lightbox && (
            <div
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
              onClick={() => { setLightbox(false); setLens(null) }}
            >
              <button
                className="absolute top-4 right-4 text-white text-3xl leading-none hover:text-gray-300 z-10"
                onClick={() => { setLightbox(false); setLens(null) }}
              >
                ×
              </button>
              <div
                ref={lightboxWrapperRef}
                className="relative p-10"
                onClick={(e) => e.stopPropagation()}
                onMouseMove={handleLightboxMouseMove}
                onMouseLeave={() => setLens(null)}
              >
                <img
                  ref={lightboxImgRef}
                  src={listing.image_url}
                  alt={listing.card_name}
                  className="max-h-[80vh] max-w-[85vw] rounded-2xl shadow-2xl select-none block"
                  draggable={false}
                />
                {lens && (
                  <div
                    className="absolute pointer-events-none rounded-full border-2 border-white/70 shadow-2xl overflow-hidden"
                    style={{
                      width: LENS_SIZE,
                      height: LENS_SIZE,
                      top: lens.py - LENS_SIZE / 2,
                      left: lens.px - LENS_SIZE / 2,
                      backgroundImage: `url(${listing.image_url})`,
                      backgroundSize: `${lens.imgW * ZOOM}px ${lens.imgH * ZOOM}px`,
                      backgroundPosition: `${lens.bgX}px ${lens.bgY}px`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                )}
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{listing.card_name}</h1>
            {listing.set_name && <p className="text-sm text-gray-400 mb-4">{listing.set_name}</p>}


            <div className="flex flex-col gap-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 w-16">品相</span>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  listing.condition === 'NM' ? 'bg-green-100 text-green-700' :
                  listing.condition === 'LP' ? 'bg-blue-100 text-blue-700' :
                  listing.condition === 'MP' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>{listing.condition}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 w-16">想換</span>
                <span className="text-sm font-medium text-gray-800">{listing.wants}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-bold text-red-500">
                {listing.user_name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="text-sm text-gray-600">{listing.user_name}</span>
            </div>

            {!isOwnListing && (
              <button
                onClick={handleOpenProposal}
                disabled={authLoading}
                className="mt-6 w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {authLoading ? '載入中...' : '提議交換'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Proposal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {proposalSuccess ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">提議已送出！</h3>
                <p className="text-sm text-gray-500 mb-6">對方會在「有興趣的人」頁面看到你的提議。</p>
                <button onClick={() => setShowModal(false)} className="px-6 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">
                  關閉
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-gray-900">提議交換</h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  你想用什麼方式交換 <span className="font-medium text-gray-900">{listing.card_name}</span>？
                </p>

                <div className="flex gap-3 mb-5">
                  <button
                    onClick={() => setOfferType('card')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-colors ${offerType === 'card' ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    提議交換卡片
                  </button>
                  <button
                    onClick={() => setOfferType('chat')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-colors ${offerType === 'chat' ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    私聊討論
                  </button>
                </div>

                {offerType === 'card' && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">選擇你要提議的卡片</p>
                    {myListings.length === 0 ? (
                      <div className="text-center py-6 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
                        你還沒有上架任何卡片
                        <a href="/listings/new" className="block mt-2 text-red-500 hover:underline">先去上架一張</a>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                        {myListings.map(l => (
                          <div
                            key={l.id}
                            onClick={() => setSelectedCardId(l.id)}
                            className={`cursor-pointer rounded-xl border-2 p-1.5 transition-colors ${selectedCardId === l.id ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                          >
                            {l.image_url ? (
                              <img src={l.image_url} alt={l.card_name} className="w-full rounded-lg" />
                            ) : (
                              <div className="bg-gray-100 rounded-lg h-16 flex items-center justify-center text-2xl">🃏</div>
                            )}
                            <p className="text-xs text-gray-600 text-center mt-1 truncate">{l.card_name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {offerType === 'chat' && (
                  <div className="mb-4 bg-blue-50 rounded-xl p-3">
                    <p className="text-sm text-blue-700">對方接受後，雙方可私下聯繫討論細節。</p>
                  </div>
                )}

                <div className="mb-5">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    備註訊息 <span className="text-gray-400 font-normal">（選填，可留聯絡方式）</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="例：我的 Line ID 是 xxx，歡迎私訊討論"
                    value={proposalMessage}
                    onChange={e => setProposalMessage(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:border-red-400 resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmitProposal}
                  disabled={proposalLoading || (offerType === 'card' && !selectedCardId)}
                  className="w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {proposalLoading ? '送出中...' : '送出提議'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
