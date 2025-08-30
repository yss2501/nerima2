'use client';

import { useState } from 'react';
import Link from 'next/link';
import OptionsManager from '@/components/OptionsManager';

export default function OptionsManagementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-green-700 relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-black/5"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 min-h-screen">
        {/* ナビゲーション */}
        <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-xl font-bold text-white hover:text-white/80 transition-colors"
              >
                🌱 練馬ワンダーランド
              </Link>
              <span className="text-white/40">|</span>
              <span className="text-white/80">選択リスト管理</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="px-4 py-2 text-white/80 hover:text-white transition-colors"
              >
                📝 スポット管理
              </Link>
              <Link
                href="/route"
                className="px-4 py-2 text-white/80 hover:text-white transition-colors"
              >
                🗺️ ルート生成
              </Link>
              <Link
                href="/"
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                🏠 ホーム
              </Link>
            </div>
          </div>
        </nav>

        {/* メインコンテンツ */}
        <main className="py-8">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl mx-4">
            <OptionsManager />
          </div>
        </main>

        {/* フッター */}
        <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="text-center text-white/80">
              <p>
                🗂️ <strong className="text-yellow-300">練馬ワンダーランド 選択リスト管理</strong> - 練馬スポット登録時に使用する選択リストの項目を管理できます
              </p>
              <div className="mt-2 space-x-4 text-sm text-white/70">
                <span>✅ カテゴリ管理</span>
                <span>✅ 項目の追加・編集・削除</span>
                <span>✅ 並び順の調整</span>
                <span>✅ 有効/無効の切り替え</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
