'use client';

import Link from 'next/link';
import CommonHeader from '@/components/CommonHeader';
import WeatherWidget from '@/components/WeatherWidget';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-green-700 relative overflow-hidden">
      {/* ヘッダー */}
      <CommonHeader />
      
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-black/5"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

      {/* メインコンテンツ */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* ヒーローセクション */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            練馬ワンダーランド
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            練馬区の隠れた名所から人気スポットまで、あなただけの練馬区観光コースを作成しましょう
          </p>
        </div>

        {/* 天気情報とナビゲーションボタン */}
        <div className="w-full max-w-4xl">
          {/* ナビゲーションボタン */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <Link
              href="/spots"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-4xl mb-3">📍</div>
              <h3 className="text-lg font-semibold text-white">スポット一覧</h3>
            </Link>
            
            <Link
              href="/route"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-4xl mb-3">🗺️</div>
              <h3 className="text-lg font-semibold text-white">ルート生成</h3>
            </Link>
          </div>
          
          {/* 天気情報 */}
          <div className="flex justify-center">
            <WeatherWidget />
          </div>
        </div>
      </div>
    </div>
  );
}