'use client';

import { useState, useEffect } from 'react';
import { Spot, RoutePoint } from '@/lib/api';

interface RouteNavigationProps {
  routePoints: RoutePoint[];
  onClose: () => void;
}

export default function RouteNavigation({ routePoints, onClose }: RouteNavigationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  // 現在地を取得
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('位置情報の取得に失敗しました:', error);
        }
      );
    }
  }, []);

  const startNavigation = () => {
    setIsNavigating(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < routePoints.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsNavigating(false);
      setCurrentStep(0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const openInMaps = (point: RoutePoint) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`;
    window.open(url, '_blank');
  };

  const openInAppleMaps = (point: RoutePoint) => {
    const url = `http://maps.apple.com/?daddr=${point.lat},${point.lng}`;
    window.open(url, '_blank');
  };

  const calculateDirection = (from: {lat: number, lng: number}, to: {lat: number, lng: number}) => {
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
    const deltaLng = (to.lng - from.lng) * Math.PI / 180;

    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360;

    if (bearing >= 337.5 || bearing < 22.5) return '北';
    if (bearing >= 22.5 && bearing < 67.5) return '北東';
    if (bearing >= 67.5 && bearing < 112.5) return '東';
    if (bearing >= 112.5 && bearing < 157.5) return '南東';
    if (bearing >= 157.5 && bearing < 202.5) return '南';
    if (bearing >= 202.5 && bearing < 247.5) return '南西';
    if (bearing >= 247.5 && bearing < 292.5) return '西';
    if (bearing >= 292.5 && bearing < 337.5) return '北西';
    return '北';
  };

  const getDistanceText = (distance?: number) => {
    if (!distance) return '';
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(1)}km`;
  };

  const getTimeText = (time?: number) => {
    if (!time) return '';
    if (time < 60) return `${time}分`;
    return `${Math.floor(time / 60)}時間${time % 60}分`;
  };

  if (!isNavigating) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold mb-4 text-gray-800">ルート案内を開始</h2>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>• 総距離: {getDistanceText(routePoints.reduce((sum, point) => sum + (point.distance_from_previous || 0), 0))}</p>
              <p>• 総時間: {getTimeText(routePoints.reduce((sum, point) => sum + (point.travel_time || 0) + (point.visit_duration || 0), 0))}</p>
              <p>• 訪問スポット: {routePoints.length}件</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={startNavigation}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                ナビゲーション開始
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentPoint = routePoints[currentStep];
  const nextPoint = routePoints[currentStep + 1];

  // currentPointが存在しない場合は早期リターン
  if (!currentPoint) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold mb-4 text-gray-800">エラー</h2>
          <p className="text-gray-600 mb-4">ルートポイントが見つかりません。</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    );
  }
  const direction = currentLocation ? calculateDirection(currentLocation, currentPoint) : '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">ルート案内</h2>
          <div className="text-sm text-gray-500">
            {currentStep + 1} / {routePoints.length}
          </div>
        </div>

        {/* 現在の目的地 */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📍</span>
            <h3 className="font-bold text-gray-800">{currentPoint.name}</h3>
          </div>
          {/* addressとdescriptionはRoutePointインターフェースに存在しないためコメントアウト */}
          {/* <p className="text-sm text-gray-600 mb-2">{currentPoint.address}</p>
          {currentPoint.description && (
            <p className="text-sm text-gray-500">{currentPoint.description}</p>
          )} */}
          {direction && (
            <div className="mt-2 text-sm text-blue-600">
              <span className="font-medium">方向: {direction}</span>
            </div>
          )}
        </div>

        {/* 距離・時間情報 */}
        {currentPoint.distance_from_previous !== undefined && currentPoint.distance_from_previous > 0 && (
          <div className="bg-green-50 rounded-lg p-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">移動距離:</span>
              <span className="font-medium text-green-700">{getDistanceText(currentPoint.distance_from_previous)}</span>
            </div>
            {currentPoint.travel_time && currentPoint.travel_time > 0 && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">移動時間:</span>
                <span className="font-medium text-green-700">{getTimeText(currentPoint.travel_time)}</span>
              </div>
            )}
          </div>
        )}

        {/* 滞在時間 */}
        {currentPoint.visit_duration !== undefined && currentPoint.visit_duration > 0 && (
          <div className="bg-purple-50 rounded-lg p-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">滞在時間:</span>
              <span className="font-medium text-purple-700">{getTimeText(currentPoint.visit_duration)}</span>
            </div>
          </div>
        )}

        {/* 次の目的地 */}
        {nextPoint && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">次:</span> {nextPoint.name}
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => openInMaps(currentPoint)}
              className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              Google Maps
            </button>
            <button
              onClick={() => openInAppleMaps(currentPoint)}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              Apple Maps
            </button>
          </div>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                前へ
              </button>
            )}
            {currentStep < routePoints.length - 1 ? (
              <button
                onClick={nextStep}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
              >
                次へ
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsNavigating(false);
                  setCurrentStep(0);
                }}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                完了
              </button>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
          >
            ナビゲーション終了
          </button>
        </div>
      </div>
    </div>
  );
}
