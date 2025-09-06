'use client';

import { useEffect, useState, useRef } from 'react';

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  className?: string;
}

export default function MapPicker({ latitude, longitude, onLocationChange, className = '' }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number }>({ lat: 35.7375, lng: 139.6547 });

  // デフォルトの座標（練馬区役所）
  const defaultLat = 35.7375;
  const defaultLng = 139.6547;

  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Leafletを動的に読み込み
        const L = await import('leaflet');
        
        // CSSを読み込み
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          link.crossOrigin = '';
          document.head.appendChild(link);
        }

        // カスタムアイコンの作成
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 20],
          popupAnchor: [0, -20]
        });

        if (mapRef.current && !mapInstanceRef.current) {
          const initialLat = latitude || defaultLat;
          const initialLng = longitude || defaultLng;
          
          // 地図を初期化
          mapInstanceRef.current = L.map(mapRef.current, {
            center: [initialLat, initialLng],
            zoom: 15,
            zoomControl: true,
          });

          // タイルレイヤーを追加
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(mapInstanceRef.current);

          // マーカーを追加
          markerRef.current = L.marker([initialLat, initialLng], {
            draggable: true,
            icon: customIcon,
          }).addTo(mapInstanceRef.current);

          // マーカーにポップアップを追加
          markerRef.current.bindPopup(`
            <div style="text-align: center;">
              <div style="font-weight: bold; margin-bottom: 4px;">選択された位置</div>
              <div style="font-size: 12px; color: #666;">
                <div>緯度: ${initialLat.toFixed(6)}</div>
                <div>経度: ${initialLng.toFixed(6)}</div>
              </div>
            </div>
          `);

          // マーカーがドラッグされた時の処理
          markerRef.current.on('dragend', (e: any) => {
            const lat = e.target.getLatLng().lat;
            const lng = e.target.getLatLng().lng;
            setMarkerPosition({ lat, lng });
            onLocationChange(lat, lng);
            
            // ポップアップを更新
            markerRef.current.setPopupContent(`
              <div style="text-align: center;">
                <div style="font-weight: bold; margin-bottom: 4px;">選択された位置</div>
                <div style="font-size: 12px; color: #666;">
                  <div>緯度: ${lat.toFixed(6)}</div>
                  <div>経度: ${lng.toFixed(6)}</div>
                </div>
              </div>
            `);
          });

          // 地図をクリックした時の処理
          mapInstanceRef.current.on('click', (e: any) => {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            // マーカーの位置を更新
            markerRef.current.setLatLng([lat, lng]);
            setMarkerPosition({ lat, lng });
            onLocationChange(lat, lng);
            
            // ポップアップを更新
            markerRef.current.setPopupContent(`
              <div style="text-align: center;">
                <div style="font-weight: bold; margin-bottom: 4px;">選択された位置</div>
                <div style="font-size: 12px; color: #666;">
                  <div>緯度: ${lat.toFixed(6)}</div>
                  <div>経度: ${lng.toFixed(6)}</div>
                </div>
              </div>
            `);
          });

          setIsLoaded(true);
        }
      } catch (error) {
        console.error('Leaflet loading error:', error);
      }
    };

    loadLeaflet();

    return () => {
      // クリーンアップ
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // 座標が変更された時にマーカーを更新
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && latitude && longitude) {
      const lat = latitude;
      const lng = longitude;
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom());
      setMarkerPosition({ lat, lng });
    }
  }, [latitude, longitude]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg border border-gray-300 dark:border-gray-600"
        style={{ minHeight: '400px' }}
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">地図を読み込み中...</p>
          </div>
        </div>
      )}
      
      <div className="absolute top-2 left-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 z-[1000]">
        💡 地図をクリックまたはマーカーをドラッグして位置を指定
      </div>
    </div>
  );
}