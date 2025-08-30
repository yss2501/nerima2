'use client';

import { useState } from 'react';
import { Spot } from '@/lib/api';

interface SimpleMapProps {
  spots: Spot[];
  onSpotClick?: (spot: Spot) => void;
}

export default function SimpleMap({ spots, onSpotClick }: SimpleMapProps) {
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  // 有効な位置情報を持つスポットのみをフィルタリング
  const validSpots = spots.filter(spot => spot.latitude && spot.longitude);

  // 地図の中心とズームを計算
  const getMapCenter = () => {
    if (validSpots.length === 0) {
      return { lat: 35.6762, lng: 139.6503, zoom: 10 }; // 東京の中心
    }

    const lats = validSpots.map(spot => parseFloat(spot.latitude!));
    const lngs = validSpots.map(spot => parseFloat(spot.longitude!));
    
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    
    return { lat: centerLat, lng: centerLng, zoom: 12 };
  };

  const mapCenter = getMapCenter();

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}時間${mins > 0 ? `${mins}分` : ''}`;
    }
    return `${mins}分`;
  };

  const getPriceRangeText = (priceRange?: string) => {
    switch (priceRange) {
      case 'free': return '無料';
      case 'low': return '安価';
      case 'medium': return '中程度';
      case 'high': return '高級';
      default: return '不明';
    }
  };

  const getCrowdLevelText = (crowdLevel?: string) => {
    switch (crowdLevel) {
      case 'low': return '空いてる';
      case 'medium': return '普通';
      case 'high': return '混雑';
      default: return '不明';
    }
  };

  return (
    <div className="space-y-6">
      {/* OpenStreetMap iframe */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <div className="w-full h-[500px] rounded-lg overflow-hidden">
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lng - 0.01},${mapCenter.lat - 0.01},${mapCenter.lng + 0.01},${mapCenter.lat + 0.01}&layer=mapnik&marker=${mapCenter.lat},${mapCenter.lng}`}
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            title="観光スポット地図"
          />
        </div>
      </div>

      {/* 観光スポット一覧 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          観光スポット一覧 ({validSpots.length}件)
        </h3>
        
        {validSpots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {validSpots.map((spot) => (
              <div
                key={spot.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => {
                  setSelectedSpot(spot);
                  onSpotClick?.(spot);
                }}
              >
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {spot.name}
                </h4>
                
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    📍 {spot.address}
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      ⏱️ {formatDuration(spot.visit_duration)}
                    </span>
                    {spot.price_range && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {getPriceRangeText(spot.price_range)}
                      </span>
                    )}
                    {spot.crowd_level && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {getCrowdLevelText(spot.crowd_level)}
                      </span>
                    )}
                  </div>
                  
                  {spot.rating && (
                    <p className="text-yellow-600 font-medium">
                      ★ {parseFloat(spot.rating).toFixed(1)}
                    </p>
                  )}
                  
                  {spot.category && (
                    <p className="text-gray-600 dark:text-gray-400">
                      カテゴリ: {spot.category}
                    </p>
                  )}
                  
                  {spot.description && (
                    <p className="text-gray-700 dark:text-gray-300 text-xs line-clamp-2">
                      {spot.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              位置情報が設定されている観光スポットがありません
            </p>
          </div>
        )}
      </div>

      {/* 選択されたスポットの詳細 */}
      {selectedSpot && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {selectedSpot.price_range && (
                  <p><span className="font-medium">料金帯:</span> {getPriceRangeText(selectedSpot.price_range)}</p>
                )}
                {selectedSpot.crowd_level && (
                  <p><span className="font-medium">混雑度:</span> {getCrowdLevelText(selectedSpot.crowd_level)}</p>
                )}
              </div>
            </div>

            <div>
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
                <div className="mt-4">
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
      )}
    </div>
  );
}
