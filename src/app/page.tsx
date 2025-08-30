'use client';

import Image from "next/image";
import Link from "next/link";

export default function Home() {

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
            <div className="flex gap-4">
              <div className="hidden md:flex gap-4">
                <a href="/route" className="text-white/80 hover:text-white transition-colors">ルート生成</a>
                <a href="/spots" className="text-white/80 hover:text-white transition-colors">スポット一覧</a>
              </div>
              <a href="/admin" className="text-white/80 hover:text-white transition-colors px-3 py-1 bg-white/10 rounded-lg border border-white/20 text-sm">⚙️ 管理</a>
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



            {/* CTAボタン */}
            <div className="animate-slide-up flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <a
                href="/route"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 min-w-[200px] justify-center"
              >
                🌱 練馬観光を開始
          </a>
          <a
                href="/spots"
                className="bg-white/10 text-white border border-white/30 hover:bg-white/20 font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 min-w-[200px] justify-center"
              >
                📍 スポット一覧
          </a>
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