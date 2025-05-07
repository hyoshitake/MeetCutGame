'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function Home() {
  const [gameState, setGameState] = useState('waiting') // waiting, playing, result

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-center mb-8">牛肉ぴったんこチャレンジ</h1>

      {gameState === 'waiting' && (
        <button
          className="px-6 py-3 text-lg bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300"
          onClick={() => setGameState('playing')}
        >
          ゲームスタート
        </button>
      )}

      {gameState === 'playing' && (
        <div className="w-full max-w-lg">
          <p className="text-center mb-4">肉をぴったり半分に切ろう！</p>
          {/* ここにゲームコンポーネントを追加 */}
        </div>
      )}

      {gameState === 'result' && (
        <div className="w-full max-w-lg text-center">
          <p className="text-xl mb-4">結果</p>
          <button
            className="px-6 py-3 text-lg bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 mt-4"
            onClick={() => setGameState('waiting')}
          >
            もう一度チャレンジ
          </button>
        </div>
      )}
    </main>
  )
}
