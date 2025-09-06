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
  const [selectedMethod, setSelectedMethod] = useState<'station' | 'search'>('station');
  const [selectedStation, setSelectedStation] = useState<'nerima' | 'toshimaen'>('nerima');

  // 練馬駅の座標（世界測地系）
  const nerimaStation = {
    lat: 35.737853,
    lng: 139.654199,
    name: '練馬駅'
  };

  // 豊島園駅の座標（世界測地系）
  const toshimaenStation = {
    lat: 35.7421,
    lng: 139.6480,
    name: '豊島園駅'
  };

  // 練馬駅を選択
  const selectNerimaStation = () => {
    onLocationSelect(nerimaStation);
  };

  // 豊島園駅を選択
  const selectToshimaenStation = () => {
    onLocationSelect(toshimaenStation);
  };

  // 現在選択されている駅を取得
  const getCurrentStation = () => {
    return selectedStation === 'nerima' ? nerimaStation : toshimaenStation;
  };

  // コンポーネントマウント時に練馬駅を自動選択
  useEffect(() => {
    selectNerimaStation();
  }, []);

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


  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
        出発地の設定方法を選択
      </h4>

      {/* 設定方法選択 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => setSelectedMethod('station')}
          className={`p-3 rounded-lg border-2 transition-colors ${
            selectedMethod === 'station'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
          }`}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🚉</div>
            <div className="font-medium text-sm">駅を選択</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              練馬駅・豊島園駅
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
      </div>

      {/* 駅選択 */}
      {selectedMethod === 'station' && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          {/* 駅選択ボタン */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => {
                setSelectedStation('nerima');
                selectNerimaStation();
              }}
              className={`p-3 rounded-lg border-2 transition-colors ${
                selectedStation === 'nerima'
                  ? 'border-blue-600 bg-blue-100 dark:bg-blue-800 shadow-lg'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🚉</div>
                <div className={`font-semibold ${
                  selectedStation === 'nerima' 
                    ? 'text-blue-800 dark:text-blue-200' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  練馬駅
                  {selectedStation === 'nerima' && (
                    <span className="ml-2 text-sm">✓</span>
                  )}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  練馬区の中心駅
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setSelectedStation('toshimaen');
                selectToshimaenStation();
              }}
              className={`p-3 rounded-lg border-2 transition-colors ${
                selectedStation === 'toshimaen'
                  ? 'border-blue-600 bg-blue-100 dark:bg-blue-800 shadow-lg'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🎢</div>
                <div className={`font-semibold ${
                  selectedStation === 'toshimaen' 
                    ? 'text-blue-800 dark:text-blue-200' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  豊島園駅
                  {selectedStation === 'toshimaen' && (
                    <span className="ml-2 text-sm">✓</span>
                  )}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  西武鉄道
                </div>
              </div>
            </button>
          </div>

          {/* 選択された駅の詳細情報 */}
          <div className="text-center">
            <h5 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
              {getCurrentStation().name}
            </h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {selectedStation === 'nerima' 
                ? '練馬区の中心駅として設定されています' 
                : '西武鉄道の駅として設定されています'}
            </p>
            
            {/* 現在選択中の駅を強調表示 */}
            <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-800 rounded-lg border-2 border-blue-300 dark:border-blue-600">
              <div className="flex items-center justify-center gap-2">
                <div className="text-2xl">
                  {selectedStation === 'nerima' ? '🚉' : '🎢'}
                </div>
                <div>
                  <div className="font-bold text-blue-800 dark:text-blue-200">
                    現在選択中: {getCurrentStation().name}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-300">
                    緯度: {getCurrentStation().lat}° 経度: {getCurrentStation().lng}°
                  </div>
                </div>
              </div>
            </div>
            
          </div>
          
          {/* 座標情報表示 */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>緯度: {getCurrentStation().lat}度</div>
              <div>経度: {getCurrentStation().lng}度</div>
              <div>（世界測地系）</div>
            </div>
          </div>
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
    </div>
  );
}
