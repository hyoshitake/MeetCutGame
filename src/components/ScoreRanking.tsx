import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Score {
  id: string;
  user_id: string;
  username: string;
  score: number;
  created_at: string;
}

export default function ScoreRanking() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        // プロフィールとスコアテーブルを結合してトップスコアを取得
        const { data, error } = await supabase
          .from('scores')
          .select(`
            id,
            user_id,
            score,
            created_at,
            profiles(username)
          `)
          .order('score', { ascending: false })
          .limit(10);

        if (error) throw error;

        // データの形式を整える
        const formattedScores = data.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          username: item.profiles?.username || '匿名プレイヤー',
          score: item.score,
          created_at: item.created_at
        }));

        setScores(formattedScores);
      } catch (err: any) {
        console.error('Error fetching scores:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  if (loading) {
    return <div className="text-center mt-8">ランキングを読み込み中...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">エラー: {error}</div>;
  }

  return (
    <div className="mt-8 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">トップスコア</h2>

      {scores.length === 0 ? (
        <p>まだスコアがありません。最初のプレイヤーになりましょう！</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left">順位</th>
                <th className="py-2 px-4 text-left">ユーザー</th>
                <th className="py-2 px-4 text-right">スコア</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, index) => (
                <tr key={score.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-4">{index + 1}</td>
                  <td className="py-2 px-4">{score.username}</td>
                  <td className="py-2 px-4 text-right">{score.score}点</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
