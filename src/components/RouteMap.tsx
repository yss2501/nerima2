'use client';

import { useEffect, useState, useRef } from 'react';
import { Spot, RouteInfo } from '@/lib/api';
import { fetchOrsRoute, LatLng } from '@/lib/routing';
import StartLocationSelector from './StartLocationSelector';

interface RouteMapProps {
  spots: Spot[];
  onSpotClick?: (spot: Spot) => void;
  onRouteGenerated?: (routeInfo: RouteInfo) => void;
}

export default function RouteMap({ spots, onSpotClick, onRouteGenerated }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  
  // ルート関連の状態
  const [selectedSpots, setSelectedSpots] = useState<Spot[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [startLocation, setStartLocation] = useState<{lat: number, lng: number, name: string} | null>(null);
  const [transportMode, setTransportMode] = useState<'walking' | 'cycling' | 'driving'>('walking');
  const [returnToStart, setReturnToStart] = useState(true);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isMapClickMode, setIsMapClickMode] = useState(false);
  const [routeLayer, setRouteLayer] = useState<any>(null);

  // 有効な位置情報を持つスポットのみをフィルタリング
  const validSpots = spots.filter(spot => spot.latitude && spot.longitude);

  useEffect(() => {
    if (!mapRef.current || validSpots.length === 0 || isMapInitialized) return;

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
        const lats = validSpots.map(spot => parseFloat(spot.latitude!));
        const lngs = validSpots.map(spot => parseFloat(spot.longitude!));
        
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
        validSpots.forEach((spot) => {
          const marker = L.default.marker([parseFloat(spot.latitude!), parseFloat(spot.longitude!)], {
            icon: customIcon
          })
            .addTo(map)
            .bindPopup(`
              <div style="min-width: 200px;">
                <h3 style="font-weight: bold; margin-bottom: 8px; color: #1f2937;">${spot.name}</h3>
                <p style="margin: 4px 0; color: #6b7280;">📍 ${spot.address}</p>
                <p style="margin: 4px 0; color: #374151;">⏱️ ${Math.floor(spot.visit_duration / 60)}時間${spot.visit_duration % 60}分</p>
                ${spot.rating ? `<p style="margin: 4px 0; color: #f59e0b; font-weight: bold;">★ ${parseFloat(spot.rating).toFixed(1)}</p>` : ''}
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
          const spot = validSpots.find(s => s.id === spotId);
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
  }, [validSpots, isMapInitialized]);

  const handleSpotSelection = (spot: Spot) => {
    if (selectedSpots.find(s => s.id === spot.id)) {
      setSelectedSpots(selectedSpots.filter(s => s.id !== spot.id));
    } else {
      setSelectedSpots([...selectedSpots, spot]);
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
        const routeData = response.data.data || response.data;
        console.log('Route Data:', routeData); // デバッグ用
        console.log('Route Points:', routeData?.route_points); // デバッグ用
        console.log('Detailed Route:', routeData?.detailed_route); // デバッグ用
        
        if (routeData && routeData.route_points) {
          console.log('Route calculation details:');
          console.log('- Transport mode:', routeData.transport_mode);
          console.log('- Total distance:', routeData.total_distance, 'km');
          console.log('- Total time:', routeData.total_time, 'minutes');
          console.log('- Travel time:', routeData.summary?.travel_time, 'minutes');
          console.log('- Visit time:', routeData.summary?.visit_time, 'minutes');
          console.log('- Route points:', routeData.route_points);
          
          setRouteInfo(routeData);
          onRouteGenerated?.(routeData);
          drawRouteOnMap(routeData);
        } else {
          console.error('Invalid route data structure:', routeData);
          alert('ルートデータの形式が正しくありません。');
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

  const drawRouteOnMap = (route: RouteInfo) => {
    if (!mapInstance) {
      console.error('Map instance not available');
      return;
    }

    if (!route || !route.route_points || !Array.isArray(route.route_points)) {
      console.error('Invalid route data:', route);
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
        .filter(point => point.lat && point.lng)
        .map(point => [point.lat, point.lng]);
      console.log('Using simplified route with', routeCoordinates.length, 'points');
      console.log('Route points used:', route.route_points);
    }
    
    if (routeCoordinates.length === 0) {
      console.error('No valid route coordinates found');
      return;
    }

    // 以前のルートを消す
    if (routeLayer) {
      routeLayer.removeFrom(mapInstance);
      setRouteLayer(null);
    }

    // ORSを使用して道なりのルートを取得
    try {
      const waypoints: LatLng[] = routeCoordinates.map(coord => [coord[0], coord[1]]);
      const profile = transportMode === 'walking' ? 'foot-walking' : 
                     transportMode === 'cycling' ? 'cycling-regular' : 'driving-car';
      
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
      console.error('ORS routing failed, using fallback:', error);
      
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
      L.marker([route.route_points[0].lat, route.route_points[0].lng], {
        icon: startIcon
      }).addTo(mapInstance).bindPopup('出発地');
    }

    // ルート全体を表示
    mapInstance.fitBounds(routeLine.getBounds(), { padding: [20, 20] });
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

          {/* 移動手段選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              移動手段
            </label>
            <select
              value={transportMode}
              onChange={(e) => setTransportMode(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="walking">🚶 徒歩</option>
              <option value="cycling">🚴 自転車</option>
              <option value="driving">🚕 タクシー</option>
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
          </div>
        </div>

        {/* 選択されたスポット一覧 */}
        {selectedSpots.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              選択されたスポット ({selectedSpots.length}件)
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedSpots.map((spot, index) => (
                <div
                  key={spot.id}
                  className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  <span className="mr-2">#{index + 1}</span>
                  {spot.name}
                  <button
                    onClick={() => handleSpotSelection(spot)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ルート情報表示 */}
        {routeInfo && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              🗺️ ルート情報
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-green-600 dark:text-green-400">総距離:</span>
                <span className="ml-2 font-medium">{routeInfo.total_distance}km</span>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400">総時間:</span>
                <span className="ml-2 font-medium">{formatDuration(routeInfo.total_time)}</span>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400">移動手段:</span>
                <span className="ml-2 font-medium">{getTransportModeText(routeInfo.transport_mode)}</span>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400">訪問スポット:</span>
                <span className="ml-2 font-medium">{routeInfo.summary.total_spots}件</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 地図コンテナ */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        {isMapClickMode && (
          <div className="mb-3 p-3 bg-purple-100 dark:bg-purple-900 rounded-lg border-2 border-purple-300 dark:border-purple-600">
            <div className="flex items-center justify-center text-purple-800 dark:text-purple-200">
              <div className="animate-pulse mr-2">📍</div>
              <span className="font-medium">地図上をクリックして出発地を設定してください</span>
            </div>
          </div>
        )}
        <div 
          ref={mapRef} 
          className={`w-full h-[500px] rounded-lg transition-all duration-300 ${
            isMapClickMode ? 'cursor-crosshair' : 'cursor-grab'
          }`}
          style={{ zIndex: 1 }}
        />
      </div>

      {/* 観光スポット一覧 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          観光スポット一覧 ({validSpots.length}件)
        </h3>
        
        {validSpots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {validSpots.map((spot) => {
              const isSelected = selectedSpots.find(s => s.id === spot.id);
              return (
                <div
                  key={spot.id}
                  className={`rounded-lg p-4 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500' 
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => handleSpotSelection(spot)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {spot.name}
                    </h4>
                    {isSelected && (
                      <span className="text-blue-600 dark:text-blue-400 text-sm">
                        ✓ 選択済み
                      </span>
                    )}
                  </div>
                  
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
                          {spot.price_range === 'free' ? '無料' : 
                           spot.price_range === 'low' ? '安価' : 
                           spot.price_range === 'medium' ? '中程度' : '高級'}
                        </span>
                      )}
                    </div>
                    
                    {spot.rating && (
                      <p className="text-yellow-600 font-medium">
                        ★ {parseFloat(spot.rating).toFixed(1)}
                      </p>
                    )}
                    
                    {spot.description && (
                      <p className="text-gray-700 dark:text-gray-300 text-xs line-clamp-2">
                        {spot.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              位置情報が設定されている観光スポットがありません
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
