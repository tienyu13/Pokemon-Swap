'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [listings, setListings] = useState<any[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [slideIndex, setSlideIndex] = useState(0)

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
      .then(d => setCards(d.data ?? []))
      .catch(() => {})
  }, [])

  return (
    <main className="min-h-screen bg-gray-50">

      <Navbar />

      <section className="bg-gray-900 px-6 py-16">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-12">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">找到你缺的那張卡</h2>
            <p className="text-lg text-gray-400 mb-8">台灣最大寶可夢卡牌交換社群，安全 · 公平 · 純交換</p>
            <div className="flex gap-3">
              <Link href="/search" className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">瀏覽卡片</Link>
              <Link href="/listings/new" className="px-6 py-3 border border-white text-white rounded-lg font-medium hover:bg-white hover:text-gray-900 transition-colors">上架我的卡</Link>
            </div>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            {[0, 1, 2].map((offset) => {
              const card = cards[(slideIndex + offset) % cards.length]
              if (!card) return null
              return (
                <img
                  key={card.id}
                  src={card.images.small}
                  alt={card.name}
                  className="w-28 rounded-xl shadow-2xl"
                  style={{ opacity: offset === 1 ? 1 : 0.5 }}
                />
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">最新上架交換</h3>
        {listings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`} className="cursor-pointer group block">
                {listing.image_url ? (
                  <img
                    src={listing.image_url}
                    alt={listing.card_name}
                    className="w-full rounded-xl shadow-md group-hover:shadow-xl transition-shadow mb-3"
                  />
                ) : (
                  <div className="bg-gray-100 rounded-xl h-52 mb-3 flex items-center justify-center text-5xl">🃏</div>
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
                <p className="text-xs text-gray-500 mb-2">想換：{listing.wants}</p>
                <div className="flex justify-end">
                  <span className="text-xs text-gray-400">{listing.user_name}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-300">
            <div className="text-5xl mb-3">🃏</div>
            <p className="text-gray-400">目前還沒有人上架，成為第一個！</p>
            <a href="/listings/new" className="mt-4 inline-block px-6 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
              上架卡片
            </a>
          </div>
        )}
      </section>

      <section className="py-16 px-6 max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">近期熱門卡片</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.id} className="bg-white rounded-xl border border-gray-200 p-3 hover:border-red-300 cursor-pointer transition-colors">
              <img src={card.images.small} alt={card.name} className="w-full rounded-lg mb-2" />
              <p className="font-bold text-gray-900 text-sm">{card.name}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{card.set.name}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
        © 2026 PokeSwap 台灣 · 純交換平台，不涉及金流
      </footer>

    </main>
  )
}
