'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { toEnglishName } from '@/lib/pokemonNames'

const conditionColors: Record<string, string> = {
  NM: 'bg-green-100 text-green-700',
  LP: 'bg-blue-100 text-blue-700',
  MP: 'bg-yellow-100 text-yellow-700',
  HP: 'bg-red-100 text-red-700',
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    setError('')

    const englishQuery = toEnglishName(query)
    const filters = [`card_name.ilike.%${query}%`]
    if (englishQuery.toLowerCase() !== query.toLowerCase()) {
      filters.push(`card_name.ilike.%${englishQuery}%`)
    }

    const { data, error: queryError } = await supabase
      .from('listings')
      .select('*')
      .or(filters.join(','))
      .order('created_at', { ascending: false })

    if (queryError) {
      setError('搜尋失敗，請稍後再試')
      setLoading(false)
      return
    }

    setResults(data ?? [])
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="bg-white border-b border-gray-200 py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">搜尋交換卡片</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="輸入卡片名稱，例：超夢、噴火龍、Pikachu"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border border-gray-300 rounded-xl px-5 py-3 text-sm text-black focus:outline-none focus:border-red-400 shadow-sm"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-8 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 shadow-sm"
            >
              {loading ? '搜尋中...' : '搜尋'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-8 px-6">

        {!searched && (
          <div className="text-center py-24">
            <p className="text-2xl font-bold text-gray-900">輸入卡片名稱開始搜尋</p>
            <p className="text-lg text-gray-900 mt-2">支援中文、英文卡名</p>
          </div>
        )}

        {searched && (
          <>
            {error ? (
              <p className="text-sm text-red-500 mb-4">{error}</p>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-5">
                  找到 <span className="font-bold text-gray-700">{results.length}</span> 筆結果
                </p>

                {results.length === 0 ? (
                  <div className="text-center py-16 text-gray-300">
                    <div className="text-5xl mb-3">😢</div>
                    <p className="font-medium text-gray-400">沒有找到符合的卡片</p>
                    <p className="text-sm mt-1 text-gray-300">試試其他關鍵字，或上架你的卡片吧！</p>
                    <a href="/listings/new" className="mt-4 inline-block px-6 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
                      上架卡片
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {results.map((listing) => (
                      <a
                        key={listing.id}
                        href={`/listings/${listing.id}`}
                        className="bg-white rounded-2xl border border-gray-200 p-5 flex gap-5 hover:border-red-300 hover:shadow-md transition-all block"
                      >
                        <div className="flex-shrink-0">
                          {listing.image_url ? (
                            <img
                              src={listing.image_url}
                              alt={listing.card_name}
                              className="w-20 rounded-xl shadow-sm"
                            />
                          ) : (
                            <div className="bg-gray-100 rounded-xl w-20 h-28 flex items-center justify-center text-4xl">
                              🃏
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-lg leading-tight">{listing.card_name}</h3>
                          {listing.set_name && (
                            <p className="text-sm text-gray-400 mt-0.5">{listing.set_name}</p>
                          )}

                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${conditionColors[listing.condition] ?? 'bg-gray-100 text-gray-600'}`}>
                              {listing.condition}
                            </span>
                            <span className="text-sm text-gray-500">
                              想換：<span className="font-medium text-gray-700">{listing.wants}</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold text-red-500">
                                {listing.user_name?.[0]?.toUpperCase() ?? '?'}
                              </div>
                              <span className="text-sm text-gray-600">{listing.user_name}</span>
                            </div>
                            <button className="px-5 py-2 bg-red-500 text-white text-sm rounded-xl font-medium hover:bg-red-600 transition-colors">
                              提議交換
                            </button>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}
