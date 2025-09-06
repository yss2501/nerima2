'use client';

import { Spot } from '@/lib/api';
import { useState } from 'react';

interface SpotCardProps {
  spot: Spot;
  onClick?: (spot: Spot) => void;
}

export default function SpotCard({ spot, onClick }: SpotCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPriceRangeColor = (priceRange?: string) => {
    switch (priceRange) {
      case 'free': return 'text-green-600 bg-green-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCrowdLevelColor = (crowdLevel?: string) => {
    switch (crowdLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}時間${mins > 0 ? `${mins}分` : ''}`;
    }
    return `${mins}分`;
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 dark:border-gray-700"
      onClick={() => onClick?.(spot)}
    >
      <div className="p-4">
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
            {spot.name}
          </h3>
          <div className="flex items-center space-x-1">
            {/* ratingはSpotインターフェースに存在しないためコメントアウト */}
            {/* {spot.rating && (
              <span className="text-yellow-500 text-sm font-medium">
                ★ {parseFloat(spot.rating).toFixed(1)}
              </span>
            )} */}
          </div>
        </div>

        {/* カテゴリとタグ */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* category、tagsはSpotインターフェースに存在しないためコメントアウト */}
          {/* {spot.category && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {spot.category}
            </span>
          )}
          {spot.tags?.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {tag}
            </span>
          ))} */}
        </div>

        {/* 基本情報 */}
        <div className="space-y-2 mb-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            📍 {spot.address}
          </p>
          <div className="flex items-center space-x-4 text-sm">
            {spot.visit_duration && (
              <span className="text-gray-600 dark:text-gray-400">
                ⏱️ {formatDuration(spot.visit_duration)}
              </span>
            )}
            {/* price_range、crowd_levelはSpotインターフェースに存在しないためコメントアウト */}
            {/* {spot.price_range && (
              <span className={`px-2 py-1 rounded text-xs ${getPriceRangeColor(spot.price_range)}`}>
                {spot.price_range === 'free' ? '無料' : 
                 spot.price_range === 'low' ? '安価' :
                 spot.price_range === 'medium' ? '中程度' : '高級'}
              </span>
            )}
            {spot.crowd_level && (
              <span className={`px-2 py-1 rounded text-xs ${getCrowdLevelColor(spot.crowd_level)}`}>
                {spot.crowd_level === 'low' ? '空いてる' :
                 spot.crowd_level === 'medium' ? '普通' : '混雑'}
              </span>
            )} */}
          </div>
        </div>

        {/* 説明文 */}
        {/* descriptionはSpotインターフェースに存在しないためコメントアウト */}
        {/* {spot.description && (
          <div className="mb-3">
            <p className={`text-sm text-gray-700 dark:text-gray-300 ${
              isExpanded ? '' : 'line-clamp-2'
            }`}>
              {spot.description}
            </p>
            {spot.description.length > 100 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-blue-600 hover:text-blue-800 text-xs mt-1"
              >
                {isExpanded ? '折りたたむ' : 'もっと見る'}
              </button>
            )}
          </div>
        )} */}

        {/* ベストシーズン */}
        {/* best_seasonはSpotインターフェースに存在しないためコメントアウト */}
        {/* {spot.best_season && spot.best_season.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              ベストシーズン:
            </p>
            <div className="flex flex-wrap gap-1">
              {spot.best_season.map((season, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                >
                  {season === 'spring' ? '春' :
                   season === 'summer' ? '夏' :
                   season === 'autumn' ? '秋' : '冬'}
                </span>
              ))}
            </div>
          </div>
        )} */}

        {/* 営業時間（折りたたみ可能） */}
        {/* opening_hoursはSpotインターフェースに存在しないためコメントアウト */}
        {/* {spot.opening_hours && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              {isExpanded ? '営業時間を隠す' : '営業時間を表示'}
            </button>
            {isExpanded && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {Object.entries(spot.opening_hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="capitalize">
                      {day === 'monday' ? '月' :
                       day === 'tuesday' ? '火' :
                       day === 'wednesday' ? '水' :
                       day === 'thursday' ? '木' :
                       day === 'friday' ? '金' :
                       day === 'saturday' ? '土' : '日'}
                    </span>
                    <span>{hours}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )} */}
      </div>
    </div>
  );
}
