'use client';

import { useEffect, useState } from 'react';
import { Spot } from '@/lib/api';

interface ClientMapProps {
  spots: Spot[];
  onSpotClick?: (spot: Spot) => void;
}

export default function ClientMap({ spots, onSpotClick }: ClientMapProps) {
  const [mapComponent, setMapComponent] = useState<React.ReactNode>(null);

  useEffect(() => {
    // クライアントサイドでのみReact Leafletをインポート
    const loadMap = async () => {
      const { MapContainer, TileLayer, Marker, Popup, useMap } = await import('react-leaflet');
      const L = await import('leaflet');

      // Leafletのデフォルトアイコン問題を解決
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // 地図の中心を自動調整するコンポーネント
      function MapCenter({ spots }: { spots: Spot[] }) {
        const map = useMap();
        
        useEffect(() => {
          if (spots.length > 0) {
            const validSpots = spots.filter(spot => spot.latitude && spot.longitude);
            
            if (validSpots.length > 0) {
              const bounds = L.default.latLngBounds(
                validSpots.map(spot => [spot.latitude!, spot.longitude!])
              );
              
              if (bounds.getNorthEast() && bounds.getSouthWest()) {
                map.fitBounds(bounds, { padding: [20, 20] });
              }
            }
          }
        }, [spots, map]);

        return null;
      }

      const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
          return `${hours}時間${mins > 0 ? `${mins}分` : ''}`;
        }
        return `${mins}分`;
      };

      const getPriceRangeText = (priceRange?: string) => {
        switch (priceRange) {
          case 'free': return '無料';
          case 'low': return '安価';
          case 'medium': return '中程度';
          case 'high': return '高級';
          default: return '不明';
        }
      };

      const getCrowdLevelText = (crowdLevel?: string) => {
        switch (crowdLevel) {
          case 'low': return '空いてる';
          case 'medium': return '普通';
          case 'high': return '混雑';
          default: return '不明';
        }
      };

      const mapElement = (
        <div className="w-full h-full min-h-[500px]">
          <MapContainer
            center={[35.6762, 139.6503]} // 東京の中心
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            className="rounded-lg"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* 観光スポットのマーカー */}
            {spots
              .filter(spot => spot.latitude && spot.longitude)
              .map((spot) => (
                <Marker
                  key={spot.id}
                  position={[spot.latitude!, spot.longitude!]}
                  eventHandlers={{
                    click: () => onSpotClick?.(spot),
                  }}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-bold text-lg mb-2">{spot.name}</h3>
                      
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600">
                          📍 {spot.address}
                        </p>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">
                            ⏱️ {formatDuration(spot.visit_duration)}
                          </span>
                          {spot.price_range && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {getPriceRangeText(spot.price_range)}
                            </span>
                          )}
                          {spot.crowd_level && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              {getCrowdLevelText(spot.crowd_level)}
                            </span>
                          )}
                        </div>
                        
                        {spot.rating && (
                          <p className="text-yellow-600 font-medium">
                            ★ {parseFloat(spot.rating).toFixed(1)}
                          </p>
                        )}
                        
                        {spot.category && (
                          <p className="text-gray-600">
                            カテゴリ: {spot.category}
                          </p>
                        )}
                        
                        {spot.description && (
                          <p className="text-gray-700 text-xs line-clamp-3">
                            {spot.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            
            <MapCenter spots={spots} />
          </MapContainer>
        </div>
      );

      setMapComponent(mapElement);
    };

    loadMap();
  }, [spots, onSpotClick]);

  if (!mapComponent) {
    return (
      <div className="w-full h-[500px] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">地図を読み込み中...</span>
      </div>
    );
  }

  return <>{mapComponent}</>;
}
