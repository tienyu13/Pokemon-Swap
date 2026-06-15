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
      <section className="bg-white py-12 px-6 border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-bold text-gray-900 text-center mb-8">怎麼交換？</h3>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">📤</div>
              <p className="font-medium text-gray-900 text-sm">上架你的卡</p>
              <p className="text-xs text-gray-400 mt-1">拍照上傳，填寫想換的卡</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🤝</div>
              <p className="font-medium text-gray-900 text-sm">提議交換</p>
              <p className="text-xs text-gray-400 mt-1">找到想要的卡，送出提議</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">✅</div>
              <p className="font-medium text-gray-900 text-sm">完成交換</p>
              <p className="text-xs text-gray-400 mt-1">雙方聯絡，安排交換</p>
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
