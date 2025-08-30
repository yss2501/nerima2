'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import { api, HealthCheckResponse } from "@/lib/api";
import Link from "next/link";

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.health();
      if (response.error) {
        setError(response.error);
      } else {
        setHealthStatus(response.data || null);
      }
    } catch (err) {
      setError('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-green-700 relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-black/5"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>

      {/* メインコンテンツ */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* ナビゲーションバー */}
        <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="text-white font-bold text-xl">
              🌱 練馬ワンダーランド
            </div>
            <div className="hidden md:flex gap-4">
              <a href="/route" className="text-white/80 hover:text-white transition-colors">ルート生成</a>
              <a href="/admin" className="text-white/80 hover:text-white transition-colors">管理</a>
              <a href="/options" className="text-white/80 hover:text-white transition-colors">設定</a>
            </div>
          </div>
        </nav>

        {/* ヒーローセクション */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* メインタイトル */}
            <div className="animate-fade-in">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                練馬区の
                <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">魅力を発見</span>
                しよう
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed">
                練馬区の隠れた名所から人気スポットまで<br className="hidden md:block"/>
                あなただけの練馬区観光コースを作成しましょう
              </p>
            </div>

            {/* システム状態表示 */}
            <div className="animate-slide-up mb-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md mx-auto mb-8 border border-white/20">
                <h3 className="text-white font-semibold mb-4 flex items-center justify-center gap-2">
                  <span className="text-2xl">🔧</span>
                  システム状態
                </h3>
                {loading && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white mx-auto mb-2"></div>
                    <p className="text-white/80 text-sm">バックエンドをチェック中...</p>
                  </div>
                )}
                
                {error && (
                  <div className="text-center">
                    <div className="text-red-300 mb-2">❌ 接続エラー</div>
                    <p className="text-white/70 text-sm mb-4">{error}</p>
                    <button
                      onClick={checkHealth}
                      className="bg-white/10 border border-white/30 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition-all duration-300"
                    >
                      再試行
                    </button>
                  </div>
                )}
                
                {healthStatus && !loading && !error && (
                  <div className="text-center">
                    <div className="text-green-300 mb-2">✅ 正常稼働中</div>
                    <p className="text-white/70 text-sm mb-2">
                      Status: {healthStatus.status}
                    </p>
                    <p className="text-white/70 text-sm mb-4">
                      {healthStatus.message}
                    </p>
                    <button
                      onClick={checkHealth}
                      className="bg-green-500/10 border border-green-300/30 hover:bg-green-500/20 text-green-300 px-4 py-2 rounded-lg text-sm transition-all duration-300"
                    >
                      更新
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* CTAボタン */}
            <div className="animate-slide-up flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <a
                href="/route"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 min-w-[200px] justify-center"
              >
                🌱 練馬観光を開始
          </a>
          <a
                href="/admin"
                className="bg-white/10 text-white border border-white/30 hover:bg-white/20 font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 min-w-[200px] justify-center"
              >
                ⚙️ スポット管理
          </a>
        </div>

            {/* 機能紹介カード */}
            <div className="animate-bounce-in grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                <div className="text-4xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold text-white mb-3">練馬ルート生成</h3>
                <p className="text-white/80">
                  練馬区内の魅力的なスポットを組み合わせて、最適な観光ルートを自動生成
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                <div className="text-4xl mb-4">📍</div>
                <h3 className="text-xl font-semibold text-white mb-3">練馬スポット管理</h3>
                <p className="text-white/80">
                  練馬区の観光スポット情報、画像、評価を簡単に管理・追加
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold text-white mb-3">練馬区内移動</h3>
                <p className="text-white/80">
                  練馬区内での移動時間を正確に計算し、効率的なルートを提案
                </p>
              </div>
            </div>

            {/* クイックナビゲーション */}
            <div className="animate-slide-up mt-16">
              <h3 className="text-2xl font-semibold text-white mb-8">クイックアクセス</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link 
                  href="/spots"
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <div className="text-2xl mb-2">📍</div>
                  <div className="text-white font-medium">練馬スポット一覧</div>
                </Link>
                <Link 
                  href="/map"
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <div className="text-2xl mb-2">🗺️</div>
                  <div className="text-white font-medium">練馬区マップ</div>
                </Link>
                <Link 
                  href="/options"
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <div className="text-2xl mb-2">🗂️</div>
                  <div className="text-white font-medium">選択リスト管理</div>
                </Link>
                <a 
                  href="http://localhost:8000/docs"
          target="_blank"
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <div className="text-2xl mb-2">📚</div>
                  <div className="text-white font-medium">API ドキュメント</div>
                </a>
              </div>
            </div>
          </div>
        </main>

        {/* フッター */}
        <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
              <div>
                <h4 className="text-white font-semibold mb-4">🌱 練馬ワンダーランド</h4>
                <p className="text-white/70 text-sm">
                  練馬区の魅力を再発見する観光ルート生成サービス
                </p>
              </div>
              <div>
                <h5 className="text-white font-semibold mb-4">主な機能</h5>
                <ul className="text-white/70 text-sm space-y-2">
                  <li>✅ 練馬区専用ルート生成</li>
                  <li>✅ 地域スポット管理</li>
                  <li>✅ 区内移動時間計算</li>
                  <li>✅ 徒歩・自転車・車対応</li>
                </ul>
              </div>
              <div>
                <h5 className="text-white font-semibold mb-4">クイックアクセス</h5>
                <div className="flex flex-col space-y-2">
                  <a href="/route" className="text-white/70 hover:text-white transition-colors text-sm">
                    🗺️ ルート生成
                  </a>
                  <a href="/admin" className="text-white/70 hover:text-white transition-colors text-sm">
                    ⚙️ スポット管理  
                  </a>
                  <a href="/options" className="text-white/70 hover:text-white transition-colors text-sm">
                    🗂️ 選択リスト管理
                  </a>
                </div>
              </div>
            </div>
            <div className="border-t border-white/20 mt-8 pt-6 text-center">
              <p className="text-white/60 text-sm">
                © 2024 練馬ワンダーランド. Made with 🌱 for 練馬区民 & 観光客.
              </p>
            </div>
          </div>
      </footer>
      </div>
    </div>
  );
}