'use client';

import { useState, useEffect } from 'react';
import { api, Spot } from '@/lib/api';
import SpotCard from '@/components/SpotCard';

export default function SpotsPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

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
    setSelectedSpot(spot);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-lg text-gray-600 dark:text-gray-400">
              観光スポットを読み込み中...
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
            観光スポット一覧
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {spots.length}件の観光スポットが見つかりました
          </p>
        </div>

        {/* スポット一覧 */}
        {spots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spots.map((spot) => (
              <SpotCard
                key={spot.id}
                spot={spot}
                onClick={handleSpotClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              観光スポットが見つかりません
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              現在、登録されている観光スポットはありません
            </p>
          </div>
        )}

        {/* スポット詳細モーダル */}
        {selectedSpot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedSpot.name}
                  </h2>
                  <button
                    onClick={() => setSelectedSpot(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      基本情報
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">住所:</span> {selectedSpot.address}</p>
                      <p><span className="font-medium">滞在時間:</span> {Math.floor(selectedSpot.visit_duration / 60)}時間{selectedSpot.visit_duration % 60}分</p>
                      {selectedSpot.category && (
                        <p><span className="font-medium">カテゴリ:</span> {selectedSpot.category}</p>
                      )}
                      {selectedSpot.rating && (
                        <p><span className="font-medium">評価:</span> ★ {parseFloat(selectedSpot.rating).toFixed(1)}</p>
                      )}
                    </div>
                  </div>

                  {selectedSpot.description && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        説明
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        {selectedSpot.description}
                      </p>
                    </div>
                  )}

                  {selectedSpot.tags && selectedSpot.tags.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        タグ
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedSpot.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
