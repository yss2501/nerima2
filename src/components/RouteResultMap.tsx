'use client';

import { useEffect, useState, useRef } from 'react';
import { RouteInfo } from '@/lib/api';
import { LatLng, fetchOrsRoute } from '@/lib/routing';

interface RouteResultMapProps {
  routeInfo: RouteInfo;
}

export default function RouteResultMap({ routeInfo }: RouteResultMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || isMapInitialized) return;

      try {
        const L = await import('leaflet');
        
        // LeafletのCSSを動的に読み込み
        if (typeof window !== 'undefined') {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // 既存の地図インスタンスをクリア
        if (mapInstance) {
          mapInstance.remove();
          setMapInstance(null);
        }

        // コンテナが既に初期化されているかチェック
        if ((mapRef.current as any)._leaflet_id) {
          console.warn('Map container already initialized, skipping...');
          return;
        }

        // 印刷時の地図サイズを考慮したビューポート設定
        const isPrintMode = window.matchMedia('print').matches;
        const zoomLevel = isPrintMode ? 14 : 13;
        
        const map = L.default.map(mapRef.current).setView([35.7385782, 139.6539496], zoomLevel);

        // OpenStreetMapタイルレイヤーを追加
        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // ルートポイントのマーカーを追加
        const markers: any[] = [];
        
        if (routeInfo.route_points && routeInfo.route_points.length > 0) {
          routeInfo.route_points.forEach((point, index) => {
            const lat = point.lat;
            const lng = point.lng;
            
            if (lat && lng) {
              let icon;
              let popupContent;
              
              if (index === 0) {
                // 出発地
                icon = L.default.divIcon({
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
                popupContent = `
                  <div class="p-2">
                    <h3 class="font-bold text-green-700">出発地</h3>
                    <p class="text-sm text-gray-600">${point.name}</p>
                    <!-- addressはRoutePointインターフェースに存在しないためコメントアウト -->
                    <!-- <p class="text-xs text-gray-500">${point.address}</p> -->
                  </div>
                `;
              } else if (index === routeInfo.route_points.length - 1 && point.name === '出発地に戻る') {
                // 帰着地
                icon = L.default.divIcon({
                  className: 'end-marker',
                  html: `
                    <div style="
                      width: 24px;
                      height: 24px;
                      background: #ef4444;
                      border: 3px solid #dc2626;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: white;
                      font-weight: bold;
                      font-size: 12px;
                    ">E</div>
                  `,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                });
                popupContent = `
                  <div class="p-2">
                    <h3 class="font-bold text-red-700">帰着地</h3>
                    <p class="text-sm text-gray-600">${point.name}</p>
                    <!-- addressはRoutePointインターフェースに存在しないためコメントアウト -->
                    <!-- <p class="text-xs text-gray-500">${point.address}</p> -->
                  </div>
                `;
              } else {
                // 中間地点
                icon = L.default.divIcon({
                  className: 'waypoint-marker',
                  html: `
                    <div style="
                      width: 20px;
                      height: 20px;
                      background: #3b82f6;
                      border: 2px solid #1d4ed8;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: white;
                      font-weight: bold;
                      font-size: 10px;
                    ">${index}</div>
                  `,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                });
                popupContent = `
                  <div class="p-2">
                    <h3 class="font-bold text-blue-700">${point.name}</h3>
                    <!-- addressはRoutePointインターフェースに存在しないためコメントアウト -->
                    <!-- <p class="text-sm text-gray-600">${point.address}</p> -->
                    ${point.description ? `<p class="text-xs text-gray-500 mt-1">${point.description}</p>` : ''}
                    ${point.visit_duration ? `<p class="text-xs text-gray-500 mt-1">滞在時間: ${Math.floor(point.visit_duration / 60)}時間${point.visit_duration % 60}分</p>` : ''}
                    ${point.distance_from_previous !== undefined && point.distance_from_previous > 0 ? `<p class="text-xs text-gray-500 mt-1">前の地点からの距離: ${point.distance_from_previous.toFixed(2)}km</p>` : ''}
                    ${point.travel_time !== undefined && point.travel_time > 0 ? `<p class="text-xs text-gray-500 mt-1">移動時間: ${Math.floor(point.travel_time / 60)}時間${point.travel_time % 60}分</p>` : ''}
                  </div>
                `;
              }

              const marker = L.default.marker([lat, lng], { icon }).addTo(map);
              marker.bindPopup(popupContent);
              markers.push(marker);
            }
          });

          // ルートを描画
          if (markers.length > 1) {
            const coordinates: LatLng[] = markers.map(marker => {
              const latLng = marker.getLatLng();
              return [latLng.lat, latLng.lng];
            });

            try {
              // 実際の道路に沿ったルートを描画
              const profile = routeInfo.transport_mode === 'walking' ? 'foot-walking' : 
                             routeInfo.transport_mode === 'cycling' ? 'cycling-regular' : 'driving-car';
              
              console.log('Fetching route from OSRM...', coordinates);
              const geojson = await fetchOrsRoute(coordinates, profile);
              
              // GeoJSONをそのまま描画
              L.default.geoJSON(geojson, {
                style: { 
                  color: '#3b82f6',
                  weight: 4,
                  opacity: 0.8
                }
              }).addTo(map);
              
              // ルート全体が入るようにフィット
              const bounds = L.default.geoJSON(geojson).getBounds();
              if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [20, 20] });
              }
              
            } catch (error) {
              console.warn('OSRM routing failed, using straight lines:', error);
              
              // フォールバック: 直線ポリライン
              L.default.polyline(coordinates, {
                color: '#3b82f6',
                weight: 4,
                opacity: 0.8,
                smoothFactor: 3,
                lineCap: 'round',
                lineJoin: 'round'
              }).addTo(map);
              
              map.fitBounds(L.default.polyline(coordinates).getBounds(), { padding: [20, 20] });
            }
          }
        }

        setMapInstance(map);
        setIsMapInitialized(true);

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
  }, [routeInfo]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <div 
        ref={mapRef} 
        className="w-full h-[500px] rounded-lg"
        style={{ zIndex: 1 }}
      />
    </div>
  );
}
