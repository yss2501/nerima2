'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CommonHeader from '@/components/CommonHeader';

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 簡単なパスワード認証（実際の運用ではより安全な認証を実装）
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('パスワードが正しくありません');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setError('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-green-700 relative overflow-hidden">
        <CommonHeader />
        
        {/* 背景装飾 */}
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

        {/* ログインフォーム */}
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">⚙️</div>
              <h1 className="text-2xl font-bold text-white mb-2">管理画面</h1>
              <p className="text-white/80">パスワードを入力してください</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワード"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  required
                />
              </div>

              {error && (
                <div className="text-red-300 text-sm text-center">{error}</div>
              )}

              <button
                type="submit"
                className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                ログイン
              </button>
            </form>

            <div className="mt-6 text-center text-white/60 text-sm">
              <p>デモ用パスワード: admin123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-green-700 relative overflow-hidden">
      <CommonHeader />
      
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-black/5"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

      {/* 管理メニュー */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">管理画面</h1>
          <p className="text-white/80">システムの管理機能にアクセスできます</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* CSV管理 */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-4">CSV管理</h3>
              <p className="text-white/80 mb-6">スポットデータのCSVインポート・エクスポート</p>
              <button
                onClick={() => router.push('/csv')}
                className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                CSV管理画面へ
              </button>
            </div>
          </div>

          {/* スポット管理 */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-center">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-semibold text-white mb-4">スポット管理</h3>
              <p className="text-white/80 mb-6">スポットの編集・削除・追加</p>
              <button
                onClick={() => router.push('/spots?edit=true')}
                className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                スポット管理画面へ
              </button>
            </div>
          </div>
        </div>

        {/* ログアウトボタン */}
        <div className="text-center mt-8">
          <button
            onClick={handleLogout}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}