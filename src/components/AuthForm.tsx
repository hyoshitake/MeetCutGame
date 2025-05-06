import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (!result.success) {
        setError(result.error || '認証エラーが発生しました');
      }
    } catch (err: any) {
      setError(err.message || '予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isLogin ? 'ログイン' : '新規登録'}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className="bg-beef-brown hover:bg-beef-light text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            {loading ? '処理中...' : isLogin ? 'ログイン' : '登録する'}
          </button>
        </div>
      </form>

      <div className="text-center mt-4">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-500 hover:text-blue-700 text-sm"
        >
          {isLogin ? '新規登録はこちら' : 'ログインはこちら'}
        </button>
      </div>
    </div>
  );
}
