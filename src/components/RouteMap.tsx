'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Spot, RouteInfo, api } from '@/lib/api';
import { LatLng, fetchOrsRoute } from '@/lib/routing';
import StartLocationSelector from './StartLocationSelector';
import RouteNavigation from './RouteNavigation';
import { useRouter } from 'next/navigation';

interface RouteMapProps {
  spots: Spot[];
  onSpotClick?: (spot: Spot) => void;
  onRouteGenerated?: (routeInfo: RouteInfo) => void;
}

export default function RouteMap({ spots, onSpotClick, onRouteGenerated }: RouteMapProps) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  
  // ルート関連の状態
  // 手動選択されたスポット（プランが選択されていない場合のみ使用）
  const [manuallySelectedSpots, setManuallySelectedSpots] = useState<Spot[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [startLocation, setStartLocation] = useState<{lat: number, lng: number, name: string} | null>(null);
  const [transportMode, setTransportMode] = useState<'walking' | 'cycling' | 'driving'>('walking');
  const [returnToStart, setReturnToStart] = useState(true);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isMapClickMode, setIsMapClickMode] = useState(false);
  const [routeLayer, setRouteLayer] = useState<any>(null);
  const [showNavigation, setShowNavigation] = useState(false);
  
  // プラン関連の状態
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [availablePlans, setAvailablePlans] = useState<string[]>([]);
  
  // 有効な位置情報を持つスポットのみをフィルタリング
  const validSpots = spots.filter(spot => spot.latitude && spot.longitude);
  
  // planSpotsをuseMemoで計算
  const planSpots = useMemo(() => {
    // if (selectedPlan) {
    //   return validSpots.filter(spot => spot.plan === selectedPlan);
    // }
    return validSpots;
  }, [selectedPlan, validSpots]);

  // プラン一覧を取得
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await api.spots.getPlans();
        if (response.data && response.data.plans) {
          setAvailablePlans(response.data.plans);
        }
      } catch (error) {
        console.error('プラン一覧の取得に失敗しました:', error);
        // フォールバック用のデフォルトプラン
        setAvailablePlans(['観光', 'グルメ', 'ショッピング', 'レジャー', '文化体験']);
      }
    };
    loadPlans();
  }, []);

  // プランが変更されたときに手動選択をクリア
  useEffect(() => {
    setManuallySelectedSpots([]);
  }, [selectedPlan]);

  // 選択されたスポットをuseMemoで計算（手動選択と自動選択を統合）
  const selectedSpots = useMemo(() => {
    if (selectedPlan && planSpots.length > 0) {
      // プランが選択されている場合は、そのプランのスポットを自動選択
      return planSpots;
    }
    // プランが選択されていない場合は、手動選択されたスポットのみ
    return manuallySelectedSpots;
  }, [selectedPlan, planSpots, manuallySelectedSpots]);

  useEffect(() => {
    if (!mapRef.current || planSpots.length === 0 || isMapInitialized) return;

    const initMap = async () => {
      try {
        // Leafletを動的インポート
        const L = await import('leaflet');
        
        // 既存のマップインスタンスをクリア
        if (mapInstance) {
          mapInstance.remove();
          setMapInstance(null);
        }

        // コンテナが既に地図で初期化されているかチェック
        if (mapRef.current && (mapRef.current as any)._leaflet_id) {
          return;
        }

        // カスタムピンアイコンを作成
        const customIcon = L.default.divIcon({
          className: 'custom-map-pin',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              background: #EF4444;
              border: 2px solid #DC2626;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              position: relative;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(45deg);
                width: 12px;
                height: 12px;
                background: #FEE2E2;
                border: 1px solid #DC2626;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  width: 6px;
                  height: 6px;
                  background: #DC2626;
                  border-radius: 50%;
                "></div>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });

        // 地図の中心を計算
        const lats = planSpots.map(spot => spot.latitude!);
        const lngs = planSpots.map(spot => spot.longitude!);
        
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

        // 新しい地図インスタンスを作成
        if (!mapRef.current) return;
        const map = L.default.map(mapRef.current).setView([centerLat, centerLng], 12);

        // タイルレイヤーを追加
        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // マーカーを追加
        const newMarkers: any[] = [];
        planSpots.forEach((spot) => {
          const marker = L.default.marker([spot.latitude!, spot.longitude!], {
            icon: customIcon
          })
            .addTo(map)
            .bindPopup(`
              <div style="min-width: 200px;">
                <h3 style="font-weight: bold; margin-bottom: 8px; color: #1f2937;">${spot.name}</h3>
                <p style="margin: 4px 0; color: #6b7280;">📍 ${spot.address}</p>
                ${spot.visit_duration ? `<p style="margin: 4px 0; color: #374151;">⏱️ ${Math.floor(spot.visit_duration / 60)}時間${spot.visit_duration % 60}分</p>` : ''}
                ${/* spot.rating ? `<p style="margin: 4px 0; color: #f59e0b; font-weight: bold;">★ ${parseFloat(spot.rating).toFixed(1)}</p>` : '' */}
                ${spot.description ? `<p style="margin: 4px 0; font-size: 12px; color: #6b7280; line-height: 1.4;">${spot.description}</p>` : ''}
                <button onclick="window.selectSpot('${spot.id}')" style="
                  background: #3b82f6;
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 4px;
                  cursor: pointer;
                  margin-top: 8px;
                  width: 100%;
                ">コースに追加</button>
              </div>
            `);

          marker.on('click', () => {
            setSelectedSpot(spot);
            onSpotClick?.(spot);
          });

          newMarkers.push(marker);
        });

        // 地図クリックイベントを追加
        map.on('click', (e: any) => {
          if (isMapClickMode) {
            const { lat, lng } = e.latlng;
            setStartLocation({
              lat: lat,
              lng: lng,
              name: `地図上の位置 (${lat.toFixed(6)}, ${lng.toFixed(6)})`
            });
            setIsMapClickMode(false);
            
            // 出発地マーカーを追加
            const startIcon = L.default.divIcon({
              className: 'start-marker',
              html: `
                <div style="
                  width: 24px;
                  height: 24px;
                  background: #10b981;
                  border: 3px solid #059669;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  font-size: 12px;
                ">S</div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });

            L.default.marker([lat, lng], {
              icon: startIcon
            }).addTo(map).bindPopup('出発地');
          }
        });

        // グローバル関数を設定（ポップアップ内のボタン用）
        (window as any).selectSpot = (spotId: string) => {
          const spot = planSpots.find(s => s.id === spotId);
          if (spot) {
            handleSpotSelection(spot);
          }
        };

        setMapInstance(map);
        setMarkers(newMarkers);
        setIsMapInitialized(true);

        // 全てのマーカーが表示されるように地図の範囲を調整
        if (newMarkers.length > 0) {
          const group = L.default.featureGroup(newMarkers);
          map.fitBounds(group.getBounds(), { padding: [20, 20] });
        }

      } catch (error) {
        console.error('地図の初期化に失敗しました:', error);
      }
    };

    initMap();

    // クリーンアップ
    return () => {
      if (mapInstance) {
        mapInstance.remove();
        setMapInstance(null);
        setIsMapInitialized(false);
      }
    };
  }, [planSpots, isMapInitialized]);

  const handleSpotSelection = (spot: Spot) => {
    if (manuallySelectedSpots.find(s => s.id === spot.id)) {
      setManuallySelectedSpots(manuallySelectedSpots.filter(s => s.id !== spot.id));
    } else {
      setManuallySelectedSpots([...manuallySelectedSpots, spot]);
    }
  };

  const calculateRoute = async () => {
    if (!startLocation || selectedSpots.length === 0) return;

    setIsCalculatingRoute(true);
    try {
      const { api } = await import('@/lib/api');
      const response = await api.route.calculate({
        start_lat: startLocation.lat,
        start_lng: startLocation.lng,
        spot_ids: selectedSpots.map(s => s.id),
        transport_mode: transportMode,
        return_to_start: returnToStart
      });

      console.log('API Response:', response); // デバッグ用

      if (response.data) {
        // APIレスポンスの構造を確認
        let routeData = response.data;
        
        // ネストされたdataプロパティがある場合の対応
        if (response.data.data) {
          routeData = response.data.data;
        }
        
        console.log('Full Response:', response); // デバッグ用
        console.log('Route Data:', routeData); // デバッグ用
        console.log('Route Points:', routeData?.route_points); // デバッグ用
        console.log('Detailed Route:', routeData?.detailed_route); // デバッグ用
        
        // ルートデータの検証を強化
        if (routeData && (
          routeData.route_points || 
          routeData.detailed_route || 
          routeData.spots ||
          (Array.isArray(routeData) && routeData.length > 0)
        )) {
          console.log('Route calculation details:');
          console.log('- Transport mode:', routeData.transport_mode);
          console.log('- Total distance:', routeData.total_distance, 'km');
          console.log('- Total time:', routeData.total_time, 'minutes');
          console.log('- Travel time:', routeData.summary?.travel_time, 'minutes');
          console.log('- Visit time:', routeData.summary?.visit_time, 'minutes');
          console.log('- Route points:', routeData.route_points);
          
          setRouteInfo(routeData);
          onRouteGenerated?.(routeData);
          
          // セッションストレージにルート情報を保存
          sessionStorage.setItem('routeInfo', JSON.stringify(routeData));
          
          // ルート生成成功後、次のページに遷移
          router.push('/route-result');
        } else {
          console.error('Invalid route data structure:', routeData);
          console.error('Response structure:', response);
          alert(`ルートデータの形式が正しくありません。\n\nデータ構造:\n${JSON.stringify(routeData, null, 2)}`);
        }
      } else {
        console.error('No data in response:', response);
        alert('APIからのレスポンスにデータがありません。');
      }
    } catch (error) {
      console.error('ルート計算エラー:', error);
      alert('ルート計算中にエラーが発生しました。');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleLocationSelect = (location: { lat: number; lng: number; name: string }) => {
    setStartLocation(location);
  };

  const handleMapClickMode = () => {
    setIsMapClickMode(true);
  };

  const drawRouteOnMap = async (route: RouteInfo) => {
    if (!mapInstance) {
      console.error('Map instance not available');
      return;
    }

    // ルートデータの検証を柔軟に
    let routePoints = null;
    
    if (route?.route_points && Array.isArray(route.route_points)) {
      routePoints = route.route_points;
    } else if (route?.detailed_route && Array.isArray(route.detailed_route)) {
      routePoints = route.detailed_route;
    } else if (route?.spots && Array.isArray(route.spots)) {
      routePoints = route.spots;
    } else if (Array.isArray(route) && route.length > 0) {
      routePoints = route;
    }

    if (!routePoints || routePoints.length === 0) {
      console.error('No valid route points found:', route);
      console.error('Available keys:', Object.keys(route || {}));
      return;
    }

    const L = require('leaflet');
    
    // 既存のルートをクリア
    mapInstance.eachLayer((layer: any) => {
      if (layer instanceof L.Polyline) {
        mapInstance.removeLayer(layer);
      }
    });

    // 詳細ルートがある場合はそれを使用、なければルートポイントを使用
    let routeCoordinates = [];
    
    console.log('Route object:', route);
    console.log('Detailed route:', route.detailed_route);
    console.log('Route points:', route.route_points);
    
    if (route.detailed_route && route.detailed_route.length > 0) {
      // OSRM APIから取得した詳細ルート
      routeCoordinates = route.detailed_route.map(point => [point.lat, point.lng]);
      console.log('Using detailed route with', routeCoordinates.length, 'points');
      console.log('First 3 detailed route points:', route.detailed_route.slice(0, 3));
    } else {
      // フォールバック: ルートポイント間の直線
      routeCoordinates = route.route_points
        .filter(point => (point.latitude && point.longitude) || (point.lat && point.lng))
        .map(point => [
          point.latitude || point.lat, 
          point.longitude || point.lng
        ]);
      console.log('Using simplified route with', routeCoordinates.length, 'points');
      console.log('Route points used:', route.route_points);
    }
    
    if (routeCoordinates.length === 0) {
      console.error('No valid route coordinates found');
      return;
    }

    // 座標数を制限（ORSの制限: 70以下）
    if (routeCoordinates.length > 70) {
      console.log(`Too many coordinates (${routeCoordinates.length}), limiting to 70`);
      routeCoordinates = routeCoordinates.slice(0, 70);
    }

    // 以前のルートを消す
    if (routeLayer) {
      routeLayer.removeFrom(mapInstance);
      setRouteLayer(null);
    }

    // 実際の道路に沿ったルートを描画
    try {
      const waypoints: LatLng[] = routeCoordinates.map(coord => [coord[0], coord[1]]);
      const profile = transportMode === 'walking' ? 'foot-walking' : 
                     transportMode === 'cycling' ? 'cycling-regular' : 'driving-car';
      
      console.log('Fetching route from OSRM...', waypoints);
      const geojson = await fetchOrsRoute(waypoints, profile);
      
      // GeoJSONをそのまま描画
      const newRouteLayer = L.geoJSON(geojson, {
        style: { 
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8
        }
      }).addTo(mapInstance);
      
      setRouteLayer(newRouteLayer);
      
      // ルート全体が入るようにフィット
      const bounds = newRouteLayer.getBounds();
      if (bounds.isValid()) {
        mapInstance.fitBounds(bounds, { padding: [20, 20] });
      }
      
    } catch (error) {
      console.warn('OSRM routing failed, using straight lines:', error);
      
      // フォールバック: 直線ポリライン
      const routeLine = L.polyline(routeCoordinates, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
        smoothFactor: 3,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mapInstance);
      
      setRouteLayer(routeLine);
      mapInstance.fitBounds(routeLine.getBounds(), { padding: [20, 20] });
    }

    // 出発地マーカーを追加
    const startIcon = L.divIcon({
      className: 'start-marker',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background: #10b981;
          border: 3px solid #059669;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">S</div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    if (route.route_points[0]) {
      L.marker([route.route_points[0].latitude || route.route_points[0].lat, route.route_points[0].longitude || route.route_points[0].lng], {
        icon: startIcon
      }).addTo(mapInstance).bindPopup('出発地');
    }

    // ルート全体を表示（routeLayerが存在する場合のみ）
    if (routeLayer) {
      mapInstance.fitBounds(routeLayer.getBounds(), { padding: [20, 20] });
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

  const getTransportModeText = (mode: string) => {
    switch (mode) {
      case 'walking': return '徒歩';
      case 'cycling': return '自転車';
      case 'driving': return 'タクシー';
      default: return '徒歩';
    }
  };

  return (
    <div className="space-y-6">
      {/* コース設定パネル */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          観光コース設定
        </h3>
        
        {/* 出発地設定 */}
        <div className="mb-6">
          <StartLocationSelector
            onLocationSelect={handleLocationSelect}
            onMapClick={handleMapClickMode}
          />
        </div>

        {/* 現在の出発地表示 */}
        {startLocation && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  出発地:
                </span>
                <span className="ml-2 text-sm text-green-700 dark:text-green-300">
                  {startLocation.name}
                </span>
              </div>
              <button
                onClick={() => setStartLocation(null)}
                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">

          {/* プラン選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              プラン
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">すべてのプラン</option>
              {availablePlans.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </div>

          {/* 移動手段選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              移動手段
            </label>
            <select
              value={transportMode}
              onChange={(e) => setTransportMode(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="walking">🚶 徒歩</option>
              <option value="cycling">🚴 自転車</option>
              <option value="driving">🚕 電車</option>
            </select>
          </div>

          {/* 出発地に戻るかどうか */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              出発地に戻る
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={returnToStart}
                onChange={(e) => setReturnToStart(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                出発地に戻る
              </span>
            </div>
          </div>

          {/* ルート計算ボタン */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              &nbsp;
            </label>
            <button
              onClick={calculateRoute}
              disabled={!startLocation || selectedSpots.length === 0 || isCalculatingRoute}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isCalculatingRoute ? '計算中...' : '🗺️ ルート生成'}
            </button>
            
            {/* ナビゲーションボタン */}
            {routeInfo && (
              <button
                onClick={() => setShowNavigation(true)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mt-2"
              >
                🧭 ルート案内開始
              </button>
            )}
          </div>
        </div>


        {/* プラン情報表示 */}
        {selectedPlan && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  選択プラン:
                </span>
                <span className="ml-2 text-sm text-blue-700 dark:text-blue-300">
                  {selectedPlan}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ルート情報表示 */}
        {routeInfo && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-green-600 dark:text-green-400">総距離:</span>
                <span className="ml-2 font-medium">{routeInfo.total_distance}km</span>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400">総時間:</span>
                <span className="ml-2 font-medium">{formatDuration(routeInfo.total_time || 0)}</span>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400">移動手段:</span>
                <span className="ml-2 font-medium">{getTransportModeText(transportMode)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ルート案内モーダル */}
      {showNavigation && routeInfo && (
        <RouteNavigation
          routePoints={routeInfo.route_points}
          onClose={() => setShowNavigation(false)}
        />
      )}
    </div>
  );
}
