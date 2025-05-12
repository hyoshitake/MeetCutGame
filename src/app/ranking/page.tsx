'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/utils/supabase'

// スコア情報の型定義
interface RankingItem {
  id: string
  score: number
  username: string
  created_at: string
}

export default function RankingPage() {
  const [rankings, setRankings] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        // スコアとユーザー情報を取得する
        // 300に近い順にソートするために、|score - 300|で絶対差の小さい順に並べる
        const { data, error } = await supabase
          .from('scores')
          .select(`
            id,
            score,
            created_at,
            user_id,
            profiles:user_id (username)
          `)
          .order('score', { ascending: false }) // 一旦データを取得

        if (error) throw error

        // データを加工して300に近い順にソート
        const formattedData: RankingItem[] = data
          .map((item: any) => ({
            id: item.id,
            score: item.score,
            username: item.profiles?.username || '名無しさん',
            created_at: new Date(item.created_at).toLocaleDateString('ja-JP')
          }))
          .sort((a: RankingItem, b: RankingItem) => {
            // 300との絶対差を計算し、小さい順（近い順）に並べる
            return Math.abs(a.score - 300) - Math.abs(b.score - 300)
          })

        setRankings(formattedData)
      } catch (err) {
        console.error('ランキング取得エラー:', err)
        setError('ランキングの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
  }, [])

  return (
    <div className="flex justify-center items-center w-full">
      <main className="flex min-h-screen flex-col items-center justify-center p-4" style={{ minWidth: '640px', maxWidth: '1200px', width: '100%' }}>
        <h1 className="text-4xl font-bold text-center mb-8">ランキング</h1>

        <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">ランキングを読み込み中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">まだ記録がありません。</p>
            </div>
          ) : (
            <>
              <p className="text-center mb-4 text-gray-700">
                スコアは<span className="font-bold">300g</span>に近いほど上位になります！
              </p>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">順位</th>
                      <th className="px-4 py-2 text-left">ニックネーム</th>
                      <th className="px-4 py-2 text-left">スコア</th>
                      <th className="px-4 py-2 text-left">300gとの差</th>
                      <th className="px-4 py-2 text-left">日付</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((rank, index) => (
                      <tr key={rank.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3">{rank.username}</td>
                        <td className="px-4 py-3">{rank.score}g</td>
                        <td className="px-4 py-3">{Math.abs(rank.score - 300).toFixed(1)}g</td>
                        <td className="px-4 py-3">{rank.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="mt-8 text-center">
            <Link href="/" className="px-6 py-3 text-lg bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300">
              トップに戻る
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
