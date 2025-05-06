'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthForm from '@/components/AuthForm';
import BeefCutGame from '@/components/BeefCutGame';
import ScoreRanking from '@/components/ScoreRanking';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [showRanking, setShowRanking] = useState(false);

  // ユーザーのプロフィールを取得
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setUsername(data.username || '');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // スコアを保存する
  const saveScore = async (score: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('scores')
        .insert({
          user_id: user.id,
          score: score
        });

      if (error) throw error;

      console.log('Score saved successfully!');
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  // ユーザー名を更新する
  const updateUsername = async (newUsername: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: newUsername,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setUsername(newUsername);
    } catch (error) {
      console.error('Error updating username:', error);
    }
  };

  if (loading) {
    return <div className="text-center p-8">読み込み中...</div>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {user ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">牛肉ぴったんこチャレンジ</h1>

            <div className="flex items-center space-x-4">
              {/* ユーザー名表示/編集 */}
              <div className="text-sm">
                <span className="mr-2">ようこそ,</span>
                {username ? (
                  <span className="font-bold">{username}</span>
                ) : (
                  <input
                    type="text"
                    placeholder="ユーザー名を設定"
                    className="border rounded px-2 py-1 text-sm"
                    onBlur={(e) => updateUsername(e.target.value)}
                  />
                )}
              </div>

              {/* ログアウトボタン */}
              <button
                onClick={() => signOut()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm"
              >
                ログアウト
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:space-x-8">
            <div className="md:w-1/2">
              <BeefCutGame
                userId={user.id}
                onSaveScore={saveScore}
              />
            </div>

            <div className="md:w-1/2 mt-8 md:mt-0">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">ランキング</h2>
                <ScoreRanking />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">牛肉ぴったんこチャレンジ</h1>
          <p className="text-center mb-6">
            ログインして、あなたのスコアを記録しよう！
          </p>
          <AuthForm />
        </div>
      )}
    </main>
  );
}
