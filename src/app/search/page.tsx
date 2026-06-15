'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { toEnglishName } from '@/lib/pokemonNames'

const conditionColors: Record<string, string> = {
  NM: 'bg-green-100 text-green-700',
  LP: 'bg-blue-100 text-blue-700',
  MP: 'bg-yellow-100 text-yellow-700',
  HP: 'bg-red-100 text-red-700',
}

const RARITIES = ['SAR', 'SR', 'RR', 'AR', 'UR', 'HR', 'R', 'U', 'C', 'PR']
const CONDITIONS = ['NM', 'LP', 'MP', 'HP']

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [rarity, setRarity] = useState('')
  const [condition, setCondition] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchListings = async (q: string, r: string, c: string) => {
    setLoading(true)
    setError('')

    let dbQuery = supabase.from('listings').select('*').order('created_at', { ascending: false })

    if (q.trim()) {
      const englishQuery = toEnglishName(q)
      const filters = [`card_name.ilike.%${q}%`]
      if (englishQuery.toLowerCase() !== q.toLowerCase()) {
        filters.push(`card_name.ilike.%${englishQuery}%`)
      }
      dbQuery = dbQuery.or(filters.join(','))
    }

    if (r) dbQuery = dbQuery.eq('rarity', r)
    if (c) dbQuery = dbQuery.eq('condition', c)

    const { data, error: queryError } = await dbQuery

    if (queryError) {
      setError('搜尋失敗，請稍後再試')
    } else {
      setResults(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchListings('', '', '')
  }, [])

  const handleSearch = () => fetchListings(query, rarity, condition)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleRarity = (r: string) => {
    const next = rarity === r ? '' : r
    setRarity(next)
    fetchListings(query, next, condition)
  }

  const handleCondition = (c: string) => {
    const next = condition === c ? '' : c
    setCondition(next)
    fetchListings(query, rarity, next)
  }

  const handleClearFilters = () => {
    setQuery('')
    setRarity('')
    setCondition('')
    fetchListings('', '', '')
  }

  const hasFilters = query.trim() || rarity || condition

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="bg-white border-b border-gray-200 py-6 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">搜尋交換卡片</h2>

          {/* Search bar */}
          <div className="flex gap-3 mb-4">
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
              disabled={loading}
              className="px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 shadow-sm"
            >
              {loading ? '...' : '搜尋'}
            </button>
          </div>

          {/* Rarity filter */}
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-2">稀有度</p>
            <div className="flex gap-2 flex-wrap">
              {RARITIES.map(r => (
                <button
                  key={r}
                  onClick={() => handleRarity(r)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    rarity === r
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-red-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Condition filter */}
          <div className="mb-1">
            <p className="text-xs text-gray-400 mb-2">品相</p>
            <div className="flex gap-2">
              {CONDITIONS.map(c => (
                <button
                  key={c}
                  onClick={() => handleCondition(c)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    condition === c
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-red-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button onClick={handleClearFilters} className="mt-3 text-xs text-gray-400 hover:text-red-500">
              清除所有篩選
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-6 px-6">
        <p className="text-sm text-gray-400 mb-5">
          {loading ? '搜尋中...' : <>找到 <span className="font-bold text-gray-700">{results.length}</span> 筆結果</>}
        </p>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {!loading && results.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="font-medium text-gray-400 mb-1">沒有找到符合的卡片</p>
            <p className="text-sm text-gray-300 mb-4">試試其他關鍵字，或上架你的卡片</p>
            <a href="/listings/new" className="inline-block px-6 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
              上架卡片
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {results.map((listing) => (
            <a
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="bg-white rounded-2xl border border-gray-200 p-5 flex gap-5 hover:border-red-300 hover:shadow-md transition-all block"
            >
              <div className="flex-shrink-0">
                {listing.image_url ? (
                  <img src={listing.image_url} alt={listing.card_name} className="w-20 rounded-xl shadow-sm" />
                ) : (
                  <div className="bg-gray-100 rounded-xl w-20 h-28 flex items-center justify-center text-4xl">🃏</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{listing.card_name}</h3>
                  {listing.rarity && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium flex-shrink-0">{listing.rarity}</span>
                  )}
                </div>
                {listing.set_name && <p className="text-sm text-gray-400 mt-0.5">{listing.set_name}</p>}

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
                  <span className="px-4 py-1.5 bg-red-500 text-white text-sm rounded-xl font-medium">提議交換</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
