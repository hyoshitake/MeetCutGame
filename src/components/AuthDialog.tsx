'use client'

import { useState, useEffect } from 'react'
import { supabase, updateUserProfile } from '@/utils/supabase'
import { Provider } from '@supabase/supabase-js'

interface AuthDialogProps {
  isOpen: boolean
  onClose: () => void
  onAuthComplete?: (userId: string, username: string) => void
}

export default function AuthDialog({ isOpen, onClose, onAuthComplete }: AuthDialogProps) {
  const [username, setUsername] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [authStep, setAuthStep] = useState<'login' | 'profile' | 'guest-email'>('login')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setUser(data.user)
        setAuthStep('profile')
      }
    }

    getUser()

    // ログイン状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          setAuthStep('profile')
        }
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setAuthStep('login')
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // ソーシャルログイン処理
  const handleSocialLogin = async (provider: Provider) => {
    try {
      setIsLoading(true)
      setAuthError(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (error) {
        setAuthError(`ログインエラー: ${error.message}`)
      }
    } catch (error: any) {
      setAuthError(`ログイン処理エラー: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }
  // ゲストログイン処理 - メールアドレスの入力フォームを表示
  const handleGuestLogin = () => {
    setAuthStep('guest-email')
    setAuthError(null)
  }

  // ゲストユーザーのメール認証処理
  const handleGuestEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!guestEmail.trim()) {
      setAuthError('メールアドレスを入力してください')
      return
    }

    try {
      setIsLoading(true)
      setAuthError(null)

      // メールリンク認証を送信
      const { error } = await supabase.auth.signInWithOtp({
        email: guestEmail,
        options: {
          emailRedirectTo: window.location.origin,
        }
      })

      if (error) {
        setAuthError(`認証メール送信エラー: ${error.message}`)
      } else {
        setAuthError(null)
        // 成功メッセージを表示
        alert('認証メールを送信しました。メール内のリンクをクリックしてログインを完了してください。')
        // ログイン画面に戻る
        setAuthStep('login')
      }
    } catch (error: any) {
      setAuthError(`認証メール送信処理エラー: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // プロフィール登録処理
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      setAuthError('ニックネームを入力してください')
      return
    }

    try {
      setIsLoading(true)
      setAuthError(null)

      if (user) {
        const result = await updateUserProfile(user.id, username)
        if (result.success) {
          if (onAuthComplete) {
            onAuthComplete(user.id, username)
          }
          onClose()
        } else {
          setAuthError('プロフィール更新に失敗しました')
        }
      }
    } catch (error: any) {
      setAuthError(`プロフィール設定エラー: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // ログアウト処理
  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">ユーザー認証</h3>

        {authError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {authError}
          </div>
        )}        {authStep === 'login' ? (
          <div className="space-y-4">
            <button
              disabled={isLoading}
              onClick={() => handleSocialLogin('google')}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Googleでログイン
            </button>
            <button
              disabled={isLoading}
              onClick={() => handleSocialLogin('facebook')}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Facebookでログイン
            </button>
            <button
              disabled={isLoading}
              onClick={handleGuestLogin}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ゲストとして続ける
            </button>
          </div>
        ) : authStep === 'guest-email' ? (
          <form onSubmit={handleGuestEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="guestEmail" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <input
                type="email"
                id="guestEmail"
                placeholder="メールアドレスを入力"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                disabled={isLoading}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                認証メールを送信します。メール内のリンクからログインしてください。
              </p>
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {isLoading ? '送信中...' : '認証メールを送信'}
            </button>
            <button
              type="button"
              onClick={() => setAuthStep('login')}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              戻る
            </button>
          </form>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                ニックネーム
              </label>
              <input
                type="text"
                id="username"
                placeholder="ニックネームを入力"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                disabled={isLoading}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {isLoading ? '処理中...' : 'プロフィールを設定'}
            </button>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ログアウト
              </button>
            </div>
          </form>
        )}

        <div className="flex justify-end mt-4">
          <button
            className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-300"
            onClick={onClose}
            disabled={isLoading}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}
