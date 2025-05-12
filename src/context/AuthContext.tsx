'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, fetchProfile } from '@/utils/supabase'

interface AuthContextProps {
  user: User | null
  session: Session | null
  profile: { id: string; username: string } | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<{ id: string; username: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // プロフィールを更新する関数
  const refreshProfile = async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id)
      if (userProfile) {
        setProfile(userProfile)
      }
    }
  }

  // サインアウト処理
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
    } catch (error) {
      console.error('サインアウト中にエラーが発生しました:', error)
    }
  }

  useEffect(() => {
    // 初回のセッション確認
    const initializeAuth = async () => {
      setIsLoading(true)

      try {        // 現在のセッションを取得
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          setSession(session)
          setUser(session.user)

          // ユーザープロフィール情報も取得
          const userProfile = await fetchProfile(session.user.id)
          if (userProfile) {
            setProfile(userProfile)
          }
        }
      } catch (error) {
        console.error('認証初期化中にエラーが発生しました:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()    // 認証状態変更のリスナーを設定
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        // ユーザーがログインした場合はプロフィール情報も取得
        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id)
          if (userProfile) {
            setProfile(userProfile)
          }
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        signOut,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// カスタムフック
export const useAuth = () => useContext(AuthContext)
