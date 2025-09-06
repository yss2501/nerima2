'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import CommonHeader from '@/components/CommonHeader';
import QRCodeDisplay from '@/components/QRCodeDisplay';

// ルート結果地図コンポーネントを動的インポート
const RouteResultMap = dynamic(() => import('@/components/RouteResultMap'), {
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

export default function RouteResultPage() {
  const router = useRouter();
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    // セッションストレージからルート情報を取得
    const storedRouteInfo = sessionStorage.getItem('routeInfo');
    if (storedRouteInfo) {
      setRouteInfo(JSON.parse(storedRouteInfo));
    } else {
      // ルート情報がない場合は前のページに戻る
      router.push('/route');
    }
  }, [router]);

  const generateRouteData = () => {
    if (!routeInfo) return '';
    
    const routeData = {
      title: '練馬ワンダーランド ルート',
      date: new Date().toLocaleDateString('ja-JP'),
      totalDistance: routeInfo.total_distance,
      totalTime: routeInfo.total_time,
      spots: routeInfo.route_points.map((point: any) => ({
        name: point.name,
        address: point.address,
        visitDuration: point.visit_duration
      }))
    };
    
    return JSON.stringify(routeData);
  };

  if (!routeInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-green-700 relative overflow-hidden">
        <CommonHeader />
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-white/30 border-t-white mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-2">ルート情報を読み込み中...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-green-700 relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-black/5"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>

      <div className="relative z-10 min-h-screen">
        <CommonHeader />

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              🗺️ ルート結果
            </h1>
            <p className="text-lg text-white/90 mb-2">
              生成されたルートを確認してください
            </p>
            <p className="text-sm text-white/70">
              生成日時: {new Date().toLocaleString('ja-JP')}
            </p>
          </div>

          {/* ルート結果地図 */}
          <div className="mb-8">
            <RouteResultMap routeInfo={routeInfo} />
          </div>

          {/* ルート概要とルート詳細 */}
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
                        {Math.floor((routeInfo.total_travel_time || 0) / 60)}時間{(routeInfo.total_travel_time || 0) % 60}分
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-white/10 rounded-xl">
                      <span className="text-white text-sm mb-1">🏛️ 滞在時間</span>
                      <span className="font-bold text-white text-lg">
                        {Math.floor((routeInfo.total_visit_time || 0) / 60)}時間{(routeInfo.total_visit_time || 0) % 60}分
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
                  onClick={() => setShowQRCode(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
                >
                  📱 QRコードで共有
                </button>
                <button
                  onClick={() => router.push('/route')}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
                >
                  🔄 新しいルートを生成
                </button>
                <Link
                  href="/"
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
                >
                  🏠 ホームに戻る
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QRコードモーダル */}
      {showQRCode && (
        <QRCodeDisplay
          data={generateRouteData()}
          routeInfo={routeInfo}
          onClose={() => setShowQRCode(false)}
        />
      )}
    </div>
  );
}
