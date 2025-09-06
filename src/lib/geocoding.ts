// ジオコーディング（住所から座標取得）のユーティリティ関数

export interface GeocodeResult {
  lat: number;
  lng: number;
  display_name: string;
  formatted_address: string;
}

export interface GeocodeResponse {
  results: GeocodeResult[];
  error?: string;
}

/**
 * 日本の住所を正規化（検索しやすい形に変換）
 * @param address 住所文字列
 * @returns 正規化された住所の配列
 */
function normalizeJapaneseAddress(address: string): string[] {
  const normalized = [];
  let baseAddress = address.trim();

  // 元の住所をそのまま追加
  normalized.push(baseAddress);

  // 番地の表記を変換
  const addressVariations = [
    // "3丁目1番3号" → "3丁目1番", "3-1-3", "3丁目1-3"
    baseAddress.replace(/(\d+)丁目(\d+)番(\d+)号?/, '$1丁目$2番'),
    baseAddress.replace(/(\d+)丁目(\d+)番(\d+)号?/, '$1-$2-$3'),
    baseAddress.replace(/(\d+)丁目(\d+)番(\d+)号?/, '$1丁目$2-$3'),
    
    // "3-1-3" → "3丁目1番3号", "3丁目1-3"
    baseAddress.replace(/(\d+)-(\d+)-(\d+)/, '$1丁目$2番$3号'),
    baseAddress.replace(/(\d+)-(\d+)-(\d+)/, '$1丁目$2-$3'),
    
    // "3丁目1-3" → "3丁目1番3号", "3-1-3"
    baseAddress.replace(/(\d+)丁目(\d+)-(\d+)/, '$1丁目$2番$3号'),
    baseAddress.replace(/(\d+)丁目(\d+)-(\d+)/, '$1-$2-$3'),
    
    // 番地部分を省略したバージョン
    baseAddress.replace(/(\d+)丁目(\d+)番(\d+)号?.*/, '$1丁目$2番'),
    baseAddress.replace(/(\d+)-(\d+)-(\d+).*/, '$1-$2'),
    baseAddress.replace(/(\d+)丁目(\d+)-(\d+).*/, '$1丁目$2番'),
    
    // より大きな区域での検索
    baseAddress.replace(/(\d+)丁目.*/, '$1丁目'),
    baseAddress.replace(/([都道府県市区町村]+).*/, '$1'),
  ];

  // 重複を除去して追加
  addressVariations.forEach(variation => {
    if (variation && variation !== baseAddress && !normalized.includes(variation)) {
      normalized.push(variation);
    }
  });

  return normalized;
}

/**
 * OpenStreetMap Nominatim APIを使用して住所から座標を取得
 * @param address 住所文字列
 * @returns 座標情報
 */
export async function geocodeAddress(address: string): Promise<GeocodeResponse> {
  if (!address.trim()) {
    return {
      results: [],
      error: '住所が入力されていません'
    };
  }

  try {
    // 住所を正規化して複数のパターンで検索
    const addressVariations = normalizeJapaneseAddress(address);
    console.log('Address variations:', addressVariations);

    let allResults: any[] = [];
    let searchAttempts = 0;

    // 複数の住所パターンで順次検索
    for (const searchAddress of addressVariations) {
      searchAttempts++;
      
      const encodedAddress = encodeURIComponent(searchAddress);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=5&countrycodes=jp&addressdetails=1`;
      
      console.log(`Geocoding attempt ${searchAttempts}:`, searchAddress, url);
      
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Tourism-Route-Generator/1.0'
          }
        });

        if (!response.ok) {
          console.warn(`HTTP ${response.status} for address: ${searchAddress}`);
          continue;
        }

        const data = await response.json();
        console.log(`Geocoding response for "${searchAddress}":`, data);

        if (data && data.length > 0) {
          // 結果をマージ（重複除去）
          data.forEach((item: any) => {
            const isDuplicate = allResults.some(existing => 
              Math.abs(parseFloat(existing.lat) - parseFloat(item.lat)) < 0.0001 &&
              Math.abs(parseFloat(existing.lon) - parseFloat(item.lon)) < 0.0001
            );
            
            if (!isDuplicate) {
              allResults.push(item);
            }
          });

          // 最初のパターンで結果が見つかった場合、後続の検索は精度向上のためのみ
          if (searchAttempts === 1 && data.length > 0) {
            break; // 元の住所で見つかった場合は他のパターンは試さない
          }
        }

        // API制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.warn(`Error searching for "${searchAddress}":`, error);
        continue;
      }

      // 十分な結果が得られた場合は終了
      if (allResults.length >= 3) {
        break;
      }
    }

    if (allResults.length === 0) {
      return {
        results: [],
        error: '指定された住所が見つかりませんでした。住所の表記を確認するか、より大まかな住所（市区町村レベル）で試してください。'
      };
    }

    // レスポンスを標準化
    const results: GeocodeResult[] = allResults.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      display_name: item.display_name,
      formatted_address: formatJapaneseAddress(item.display_name)
    }));

    // 元の住所との関連性でソート
    const sortedResults = results.sort((a, b) => {
      const scoreA = calculateAddressRelevance(address, a.formatted_address);
      const scoreB = calculateAddressRelevance(address, b.formatted_address);
      return scoreB - scoreA;
    });

    return {
      results: sortedResults.slice(0, 5), // 最大5件に制限
      error: undefined
    };

  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      results: [],
      error: 'ジオコーディングに失敗しました。ネットワーク接続を確認してください。'
    };
  }
}

/**
 * 住所の関連性スコアを計算
 */
function calculateAddressRelevance(original: string, candidate: string): number {
  let score = 0;
  const originalLower = original.toLowerCase();
  const candidateLower = candidate.toLowerCase();

  // 完全一致は最高スコア
  if (candidateLower.includes(originalLower)) score += 100;

  // 数字の一致をチェック
  const originalNumbers = original.match(/\d+/g) || [];
  const candidateNumbers = candidate.match(/\d+/g) || [];
  
  originalNumbers.forEach(num => {
    if (candidateNumbers.includes(num)) score += 20;
  });

  // 漢字の一致をチェック
  const originalKanji = original.match(/[一-龯]+/g) || [];
  const candidateKanji = candidate.match(/[一-龯]+/g) || [];
  
  originalKanji.forEach(kanji => {
    if (candidateKanji.some(ck => ck.includes(kanji))) score += 10;
  });

  return score;
}

/**
 * 日本の住所表示を整形
 * @param displayName OpenStreetMapのdisplay_name
 * @returns 整形された住所
 */
function formatJapaneseAddress(displayName: string): string {
  // OpenStreetMapの display_name は "詳細, 市区町村, 都道府県, 日本" の形式
  const parts = displayName.split(',').map(part => part.trim());
  
  // 日本の住所として適切な形式に変換
  if (parts.length >= 3) {
    // 最後の "日本" を除く
    const relevantParts = parts.slice(0, -1);
    // 逆順にして日本の住所形式にする
    return relevantParts.reverse().join('');
  }
  
  return displayName;
}

/**
 * 複数の住所候補から最適なものを選択するためのヘルパー
 * @param results ジオコーディング結果
 * @param originalAddress 元の住所
 * @returns 最適な結果
 */
export function selectBestGeocodeResult(results: GeocodeResult[], originalAddress: string): GeocodeResult | null {
  if (results.length === 0) return null;
  if (results.length === 1) return results[0];

  // 元の住所との類似度でスコアリング
  const scoredResults = results.map(result => {
    let score = 0;
    const resultLower = result.formatted_address.toLowerCase();
    const originalLower = originalAddress.toLowerCase();

    // 完全一致は最高スコア
    if (resultLower.includes(originalLower) || originalLower.includes(resultLower)) {
      score += 100;
    }

    // 都道府県名の一致
    const prefectures = ['東京', '大阪', '京都', '神奈川', '千葉', '埼玉', '愛知', '福岡', '北海道'];
    for (const pref of prefectures) {
      if (resultLower.includes(pref) && originalLower.includes(pref)) {
        score += 50;
        break;
      }
    }

    // 市区町村名の一致（簡易的）
    const addressParts = originalAddress.split(/[市区町村]/);
    for (const part of addressParts) {
      if (part.length > 1 && resultLower.includes(part)) {
        score += 30;
      }
    }

    return { result, score };
  });

  // 最高スコアの結果を返す
  scoredResults.sort((a, b) => b.score - a.score);
  return scoredResults[0].result;
}

/**
 * 座標の妥当性をチェック
 * @param lat 緯度
 * @param lng 経度
 * @returns 日本国内の座標かどうか
 */
export function isValidJapaneseCoordinates(lat: number, lng: number): boolean {
  // 日本の大まかな座標範囲
  const japanBounds = {
    north: 45.7,   // 最北端（択捉島）
    south: 20.2,   // 最南端（沖ノ鳥島）
    east: 154.0,   // 最東端（南鳥島）
    west: 122.7    // 最西端（与那国島）
  };

  return lat >= japanBounds.south && 
         lat <= japanBounds.north && 
         lng >= japanBounds.west && 
         lng <= japanBounds.east;
}

/**
 * 距離を計算（ハヴァーサイン公式）
 * @param lat1 地点1の緯度
 * @param lng1 地点1の経度
 * @param lat2 地点2の緯度
 * @param lng2 地点2の経度
 * @returns 距離（km）
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 地球の半径（km）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
