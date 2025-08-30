'use client';

import { useState, useEffect } from 'react';
import { api, Spot } from '@/lib/api';
import dynamic from 'next/dynamic';

// カスタムピン地図コンポーネントを動的インポート
const CustomMapPin = dynamic(() => import('@/components/CustomMapPin'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-gray-600 dark:text-gray-400">地図を読み込み中...</span>
    </div>
  ),
});

export default function MapPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSpots();
  }, []);

  const loadSpots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.spots.getAll();
      if (response.error) {
        setError(response.error);
      } else {
        setSpots(response.data || []);
      }
    } catch (err) {
      setError('観光スポットの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSpotClick = (spot: Spot) => {
    // スポットクリック時の処理（必要に応じて追加）
    console.log('Selected spot:', spot.name);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-lg text-gray-600 dark:text-gray-400">
              地図を読み込み中...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">❌ エラーが発生しました</div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={loadSpots}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            観光スポット地図
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {spots.length}件の観光スポットが地図上に表示されています
          </p>
        </div>

        {/* 地図とスポット一覧 */}
        <CustomMapPin
          spots={spots}
          onSpotClick={handleSpotClick}
        />
      </div>
    </div>
  );
}
