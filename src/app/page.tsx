'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [listings, setListings] = useState<any[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [slideIndex, setSlideIndex] = useState(0)
  const [cardsLoading, setCardsLoading] = useState(true)

  useEffect(() => {
    if (cards.length === 0) return
    const timer = setInterval(() => {
      setSlideIndex(i => (i + 1) % cards.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [cards])

  useEffect(() => {
    supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => setListings(data ?? []))

    fetch('https://api.pokemontcg.io/v2/cards?q=rarity:"Special Illustration Rare"&orderBy=-set.releaseDate&pageSize=8')
      .then(r => r.json())
      .then(d => { setCards(d.data ?? []); setCardsLoading(false) })
      .catch(() => setCardsLoading(false))
  }, [])

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gray-900 px-6 py-12 md:py-16">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <p className="text-red-400 text-sm font-medium mb-2 uppercase tracking-wider">純交換 · 零手續費</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">找到你缺的那張卡</h2>
            <p className="text-base md:text-lg text-gray-400 mb-6">台灣最大寶可夢卡牌交換社群<br className="md:hidden" />安全、公平、直接交換</p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/search" className="px-5 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 text-sm md:text-base">瀏覽所有卡片</Link>
              <Link href="/listings/new" className="px-5 py-2.5 border border-white text-white rounded-lg font-medium hover:bg-white hover:text-gray-900 transition-colors text-sm md:text-base">上架我的卡</Link>
            </div>
            <div className="flex gap-6 mt-8">
              <div>
                <p className="text-2xl font-bold text-white">{listings.length}+</p>
                <p className="text-xs text-gray-400">上架中</p>
              </div>
              <div className="w-px bg-gray-700" />
              <div>
                <p className="text-2xl font-bold text-white">24H</p>
                <p className="text-xs text-gray-400">全天可交換</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-center md:justify-end flex-shrink-0">
            {cards.length > 0 ? [0, 1, 2].map((offset) => {
              const card = cards[(slideIndex + offset) % cards.length]
              if (!card) return null
              return (
                <img
                  key={card.id}
                  src={card.images.small}
                  alt={card.name}
                  className="w-20 md:w-28 rounded-xl shadow-2xl"
                  style={{ opacity: offset === 1 ? 1 : 0.5 }}
                />
              )
            }) : (
              <div className="flex gap-3">
                {[0,1,2].map(i => (
                  <div key={i} className="w-20 md:w-28 h-28 md:h-40 bg-gray-800 rounded-xl animate-pulse" />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-14 px-6 border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 text-center mb-12">怎麼交換？</h3>
          <div className="grid grid-cols-3 gap-8 text-center relative">
            {/* connector line */}
            <div className="absolute top-10 left-[22%] right-[22%] h-px bg-gray-200 hidden md:block" />

            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-full border-2 border-gray-200 flex items-center justify-center bg-white">
                  <svg className="w-9 h-9 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
              </div>
              <p className="font-semibold text-gray-900 mb-1">上架你的卡</p>
              <p className="text-xs text-gray-400 leading-relaxed">拍照上傳，填寫想換的卡</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-full border-2 border-gray-200 flex items-center justify-center bg-white">
                  <svg className="w-9 h-9 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
              </div>
              <p className="font-semibold text-gray-900 mb-1">提議交換</p>
              <p className="text-xs text-gray-400 leading-relaxed">找到想要的卡，送出提議</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-full border-2 border-gray-200 flex items-center justify-center bg-white">
                  <svg className="w-9 h-9 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">3</span>
              </div>
              <p className="font-semibold text-gray-900 mb-1">完成交換</p>
              <p className="text-xs text-gray-400 leading-relaxed">雙方聯絡，安排交換</p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest listings */}
      <section className="py-12 px-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">最新上架交換</h3>
          <Link href="/search" className="text-sm text-red-500 hover:underline">查看全部 →</Link>
        </div>
        {listings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`} className="cursor-pointer group block">
                {listing.image_url ? (
                  <img
                    src={listing.image_url}
                    alt={listing.card_name}
                    className="w-full rounded-xl shadow-md group-hover:shadow-xl transition-shadow mb-3"
                  />
                ) : (
                  <div className="bg-gray-100 rounded-xl h-40 mb-3 flex items-center justify-center text-4xl">🃏</div>
                )}
                <div className="flex items-start justify-between gap-1 mb-1">
                  <p className="font-bold text-gray-900 text-sm leading-tight">{listing.card_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    listing.condition === 'NM' ? 'bg-green-100 text-green-700' :
                    listing.condition === 'LP' ? 'bg-blue-100 text-blue-700' :
                    listing.condition === 'MP' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{listing.condition}</span>
                </div>
                <p className="text-xs text-gray-500">想換：{listing.wants}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 font-medium mb-1">還沒有人上架</p>
            <p className="text-sm text-gray-300 mb-4">成為第一個上架的人！</p>
            <Link href="/listings/new" className="inline-block px-6 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
              上架我的第一張卡
            </Link>
          </div>
        )}
      </section>

      {/* Hot cards */}
      <section className="py-12 px-6 max-w-4xl mx-auto">
        <h3 className="text-xl font-bold text-gray-900 mb-6">近期熱門卡片</h3>
        {cardsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        ) : cards.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((card) => (
              <Link key={card.id} href={`/search?q=${encodeURIComponent(card.name)}`} className="bg-white rounded-xl border border-gray-200 p-3 hover:border-red-300 cursor-pointer transition-colors block">
                <img src={card.images.small} alt={card.name} className="w-full rounded-lg mb-2" />
                <p className="font-bold text-gray-900 text-sm">{card.name}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{card.set.name}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">卡片資料載入中，請稍後重新整理</p>
        )}
      </section>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
        © 2026 PokeSwap 台灣 · 寶可夢卡牌交換平台
      </footer>
    </main>
  )
}
