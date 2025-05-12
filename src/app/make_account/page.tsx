'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { updateUserProfile } from '@/utils/supabase'

export default function MakeAccount() {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user, refreshProfile } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setError('ニックネームを入力してください')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      if (user) {
        const result = await updateUserProfile(user.id, username)
        if (result.success) {
          // プロフィール情報を更新
          await refreshProfile()
          // ホームページにリダイレクト
          router.push('/')
        } else {
          setError('プロフィール更新に失敗しました')
        }
      }
    } catch (error: any) {
      setError(`プロフィール設定エラー: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            アカウント作成
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ゲームであなたを表示するニックネームを設定してください
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              ニックネーム
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="ニックネームを入力"
              disabled={isLoading}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
