'use client';

import { useState, useEffect } from 'react';
import { api, Spot, RouteInfo } from '@/lib/api';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import RouteNavigation from '@/components/RouteNavigation';
import CommonHeader from '@/components/CommonHeader';
import QRCodeDisplay from '@/components/QRCodeDisplay';

// ルート地図コンポーネントを動的インポート
const RouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center border border-white/20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <span className="text-blue-600 dark:text-blue-400 font-medium">地図を読み込み中...</span>
      </div>
    </div>
  ),
});

function RoutePageContent() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showNavigation, setShowNavigation] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      loadSpots();
    }
  }, []);

  const loadSpots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // URLパラメータからCSVスポットデータを取得
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      const csvSpotsParam = urlParams.get('csvSpots');
      if (csvSpotsParam) {
        try {
          const csvSpots = JSON.parse(decodeURIComponent(csvSpotsParam));
          console.log('CSV spots loaded:', csvSpots);
          setSpots(csvSpots);
          setLoading(false);
          return;
        } catch (e) {
          console.error('Failed to parse CSV spots:', e);
        }
      }
      
      // CSVスポットがない場合はSupabaseから取得
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
    console.log('Selected spot:', spot.name);
  };

  const handleRouteGenerated = (route: RouteInfo) => {
    setRouteInfo(route);
    console.log('Route generated:', route);
  };

  // QRコード用のルートデータを生成
  const generateRouteData = () => {
    if (!routeInfo) return '';
    
    const routeData = {
      title: '練馬ワンダーランド ルート',
      spots: routeInfo.route_points.map(point => ({
        name: point.name,
        lat: point.lat,
        lng: point.lng,
        visit_duration: point.visit_duration
      })),
      total_distance: routeInfo.total_distance,
      total_time: routeInfo.total_time,
      transport_mode: routeInfo.transport_mode,
      created_at: new Date().toISOString()
    };
    
    return JSON.stringify(routeData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 relative overflow-hidden">
        {/* 背景装飾 */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-white/30 border-t-white mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-2">データを読み込み中...</h2>
            <p className="text-white/80">観光スポット情報を取得しています</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 relative overflow-hidden">
        {/* 背景装飾 */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-2xl font-bold text-white mb-4">エラーが発生しました</h2>
            <p className="text-white/80 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={loadSpots}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                🔄 再試行
              </button>
              <Link
                href="/"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/30 font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 text-center"
              >
                🏠 ホームに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-green-700 relative overflow-hidden">
      {/* ヘッダー */}
      <CommonHeader />
      
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-black/5"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>

      <div className="relative z-10 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* メイン地図コンテナ */}
          <div className="animate-slide-up mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl">
              <RouteMap
                spots={spots}
                onSpotClick={handleSpotClick}
                onRouteGenerated={handleRouteGenerated}
              />
            </div>
          </div>

          {/* 生成されたルートの詳細表示 */}
          {routeInfo && (
            <div className="animate-bounce-in">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
                
                <div className="space-y-6">
                  {/* ルート概要 */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      📊 ルート概要
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="flex flex-col items-center p-3 bg-white/10 rounded-xl">
                        <span className="text-white text-sm mb-1">📏 総距離</span>
                        <span className="font-bold text-white text-lg">{routeInfo.total_distance}km</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-white/10 rounded-xl">
                        <span className="text-white text-sm mb-1">⏱️ 総時間</span>
                        <span className="font-bold text-white text-lg">
                          {Math.floor((routeInfo.total_time || 0) / 60)}時間{(routeInfo.total_time || 0) % 60}分
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-white/10 rounded-xl">
                        <span className="text-white text-sm mb-1">🚶 移動時間</span>
                        <span className="font-bold text-white text-lg">
                          {Math.floor((routeInfo.summary.travel_time || 0) / 60)}時間{(routeInfo.summary.travel_time || 0) % 60}分
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-white/10 rounded-xl">
                        <span className="text-white text-sm mb-1">🏛️ 滞在時間</span>
                        <span className="font-bold text-white text-lg">
                          {Math.floor((routeInfo.summary.visit_time || 0) / 60)}時間{(routeInfo.summary.visit_time || 0) % 60}分
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-white/10 rounded-xl">
                        <span className="text-white text-sm mb-1">📍 訪問スポット</span>
                        <span className="font-bold text-white text-lg">
                          {Math.max(0, (routeInfo.route_points?.length || 0) - 2)}件
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-white/10 rounded-xl">
                        <span className="text-white text-sm mb-1">🚀 移動手段</span>
                        <span className="font-bold text-white text-sm">
                          {routeInfo.transport_mode === 'walking' ? '🚶 徒歩' :
                           routeInfo.transport_mode === 'cycling' ? '🚴 自転車' : '🚕 タクシー'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ルート詳細 */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      📋 ルート詳細
                    </h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {routeInfo.route_points.map((point: any, index: number) => (
                        <div key={index} className="bg-white/10 rounded-xl p-4 border border-white/20">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1 flex space-x-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-white text-lg">
                                  {point.name}
                                </h4>
                                <div className="text-sm text-white/70 space-y-1 mt-2">
                                  {index > 0 && (
                                    <p className="flex items-center gap-2">
                                      <span>🕐</span> 移動時間: {Math.floor(point.travel_time / 60)}時間{point.travel_time % 60}分
                                    </p>
                                  )}
                                  {point.visit_duration && point.visit_duration > 0 && (
                                    <p className="flex items-center gap-2">
                                      <span>⏰</span> 滞在時間: {Math.floor(point.visit_duration / 60)}時間{point.visit_duration % 60}分
                                    </p>
                                  )}
                                  {index > 0 && point.distance_from_previous && (
                                    <p className="flex items-center gap-2">
                                      <span>📏</span> 距離: {point.distance_from_previous.toFixed(2)}km
                                    </p>
                                  )}
                                  {index > 0 && point.travel_time_from_previous && (
                                    <p className="flex items-center gap-2">
                                      <span>🚶</span> 移動時間: {Math.floor(point.travel_time_from_previous / 60)}時間{point.travel_time_from_previous % 60}分
                                    </p>
                                  )}
                                </div>
                              </div>
                              {/* スポット画像表示 */}
                              {(point as any).image_id && (
                                <div className="flex-shrink-0 w-20 h-20">
                                  <img
                                    src={`/api/images/${(point as any).image_id}`}
                                    alt={point.name}
                                    className="w-full h-full object-cover rounded-xl border-2 border-white/30 shadow-lg"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="mt-8 flex flex-wrap gap-4 justify-center">
                  <button
                    onClick={() => setShowNavigation(true)}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
                  >
                    🧭 ルート案内開始
                  </button>
                  <button
                    onClick={() => {
                      alert('PDF出力機能は今後実装予定です');
                    }}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
                  >
                    📄 PDFで出力
                  </button>
                  <button
                    onClick={() => setShowQRCode(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
                  >
                    📱 QRコードで共有
                  </button>
                  <button
                    onClick={() => {
                      alert('カレンダー追加機能は今後実装予定です');
                    }}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
                  >
                    📅 カレンダーに追加
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ルート案内モーダル */}
      {showNavigation && routeInfo && (
        <RouteNavigation
          routePoints={routeInfo.route_points}
          onClose={() => setShowNavigation(false)}
        />
      )}

      {/* QRコードモーダル */}
      {showQRCode && routeInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                📱 QRコードで共有
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                このQRコードをスキャンしてルートを共有できます
              </p>
              
              <QRCodeDisplay 
                data={generateRouteData()} 
                routeInfo={routeInfo}
                size={250}
                className="mb-6"
              />
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowQRCode(false)}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  閉じる
                </button>
                <button
                  onClick={() => {
                    // QRコードをダウンロード
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                      const link = document.createElement('a');
                      link.download = 'nerima-route-qr.png';
                      link.href = canvas.toDataURL();
                      link.click();
                    }
                  }}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  📥 ダウンロード
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoutePage() {
  return <RoutePageContent />;
}