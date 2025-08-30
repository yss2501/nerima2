'use client';

import { useState, useEffect } from 'react';

interface StartLocationSelectorProps {
  onLocationSelect: (location: { lat: number; lng: number; name: string }) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function StartLocationSelector({ onLocationSelect, onMapClick }: StartLocationSelectorProps) {
  const [locationInput, setLocationInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<'current' | 'search' | 'map'>('current');

  // 現在地を取得
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsSearching(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onLocationSelect({
            lat: latitude,
            lng: longitude,
            name: '現在地'
          });
          setIsSearching(false);
        },
        (error) => {
          console.error('位置情報の取得に失敗しました:', error);
          alert('現在地の取得に失敗しました。別の方法で出発地を設定してください。');
          setIsSearching(false);
        }
      );
    } else {
      alert('お使いのブラウザは位置情報をサポートしていません。');
    }
  };

  // 住所検索
  const searchLocation = async () => {
    if (!locationInput.trim()) return;

    setIsSearching(true);
    try {
      // OpenStreetMap Nominatim APIを使用して住所検索
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationInput)}&limit=5&countrycodes=jp`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('住所検索エラー:', error);
      alert('住所検索に失敗しました。');
    } finally {
      setIsSearching(false);
    }
  };

  // 検索結果から場所を選択
  const selectSearchResult = (result: any) => {
    onLocationSelect({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      name: result.display_name.split(',')[0] // 最初の部分を場所名として使用
    });
    setLocationInput(result.display_name);
    setSearchResults([]);
  };

  // 地図クリックモードを有効化
  const enableMapClickMode = () => {
    setSelectedMethod('map');
    if (onMapClick) {
      // 地図クリックイベントを有効化するためのコールバック
      onMapClick(0, 0); // ダミー値、実際の処理は親コンポーネントで行う
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
        出発地の設定方法を選択
      </h4>

      {/* 設定方法選択 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <button
          onClick={() => setSelectedMethod('current')}
          className={`p-3 rounded-lg border-2 transition-colors ${
            selectedMethod === 'current'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
          }`}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">📍</div>
            <div className="font-medium text-sm">現在地</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              GPSで現在地を取得
            </div>
          </div>
        </button>

        <button
          onClick={() => setSelectedMethod('search')}
          className={`p-3 rounded-lg border-2 transition-colors ${
            selectedMethod === 'search'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
          }`}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🔍</div>
            <div className="font-medium text-sm">住所検索</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              住所や地名で検索
            </div>
          </div>
        </button>

        <button
          onClick={() => setSelectedMethod('map')}
          className={`p-3 rounded-lg border-2 transition-colors ${
            selectedMethod === 'map'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
          }`}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🗺️</div>
            <div className="font-medium text-sm">地図クリック</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              地図上で直接選択
            </div>
          </div>
        </button>
      </div>

      {/* 現在地設定 */}
      {selectedMethod === 'current' && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            現在地を出発地として設定します。位置情報の許可が必要です。
          </p>
          <button
            onClick={getCurrentLocation}
            disabled={isSearching}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? '位置情報を取得中...' : '📍 現在地を設定'}
          </button>
        </div>
      )}

      {/* 住所検索 */}
      {selectedMethod === 'search' && (
        <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="例: 東京駅, 渋谷スクランブル交差点, 浅草寺..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
            />
            <button
              onClick={searchLocation}
              disabled={isSearching || !locationInput.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? '検索中...' : '🔍 検索'}
            </button>
          </div>

          {/* 検索結果 */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                検索結果:
              </p>
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => selectSearchResult(result)}
                  className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {result.display_name.split(',')[0]}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {result.display_name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 地図クリック */}
      {selectedMethod === 'map' && (
        <div className="p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            地図上をクリックして出発地を設定してください。地図が表示されたら、任意の場所をクリックしてください。
          </p>
          <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-600">
            <div className="text-center">
              <div className="text-3xl mb-2">🗺️</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                地図上でクリックして<br />
                出発地を設定してください
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
