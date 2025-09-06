export type LatLng = [number, number]; // [lat, lng]

// OSRM (Open Source Routing Machine) を使用 - 無料で利用可能
const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';

export async function fetchOrsRoute(coords: LatLng[], profile = "foot-walking") {
  try {
    // OSRMの形式に合わせて座標を変換 [lng,lat]の形式
    const coordinates = coords.map(coord => `${coord[1]},${coord[0]}`).join(';');
    
    // プロファイルをOSRMの形式に変換
    const osrmProfile = profile === "foot-walking" ? "foot" : 
                       profile === "cycling-regular" ? "bike" : "car";
    
    const response = await fetch(`${OSRM_BASE_URL}/${osrmProfile}/${coordinates}?overview=full&geometries=geojson`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('OSRM routing failed: No route found');
    }

    // GeoJSON形式で返す
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: data.routes[0].geometry,
        properties: {
          distance: data.routes[0].distance,
          duration: data.routes[0].duration
        }
      }]
    };
  } catch (error) {
    console.error('OSRM routing error:', error);
    // フォールバック: 直線ルート
    return generateStraightLineRoute(coords);
  }
}

// フォールバック用の直線ルート生成
export function generateStraightLineRoute(coords: LatLng[]) {
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coords.map(coord => [coord[1], coord[0]]) // [lng, lat]の形式
      },
      properties: {}
    }]
  };
}
