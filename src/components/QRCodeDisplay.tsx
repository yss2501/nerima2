'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  data: string;
  size?: number;
  className?: string;
  onClose?: () => void;
  routeInfo?: any; // ルート情報を追加
}

export default function QRCodeDisplay({ data, size = 200, className = '', onClose, routeInfo }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GoogleマップのURLを生成する関数
  const generateGoogleMapsURL = () => {
    if (!routeInfo || !routeInfo.route_points || routeInfo.route_points.length === 0) {
      // フォールバックとして元のデータを返す
      return data;
    }

    const points = [...routeInfo.route_points]; // 元の配列を破壊しないようにコピー
    
    // 最後の地点が最初の地点と同じか確認し、異なる場合は最初の地点を最後に追加
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    if (firstPoint.latitude !== lastPoint.latitude || firstPoint.longitude !== lastPoint.longitude) {
        points.push(firstPoint);
    }
    
    // 移動手段を設定
    const travelMode = routeInfo.transport_mode === 'walking' ? 'walking' : 
                      routeInfo.transport_mode === 'cycling' ? 'bicycling' : 'driving';
    
    // スポットが1つの場合は、その場所を表示
    if (points.length <= 1) {
      const point = points[0];
      return `https://www.google.com/maps/dir/$6${point.latitude},${point.longitude}`;
    }

    // 複数のスポットがある場合は、最初から最後までのルート
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    
    // 経由地を「|」で結合
    const waypoints = points.slice(1, -1)
        .map(point => `${point.latitude},${point.longitude}`)
        .join('|');
    
    let mapsURL = `https://www.google.com/maps/dir/$7${startPoint.latitude},${startPoint.longitude}&daddr=${endPoint.latitude},${endPoint.longitude}`;
    
    if (waypoints) {
      mapsURL += `&waypoints=${waypoints}`;
    }
    
    mapsURL += `&travelmode=${travelMode}`;
    
    console.log('Generated Google Maps URL:', mapsURL);
    console.log('Route points:', points);
    console.log('Travel mode:', travelMode);
    
    return mapsURL;
  };

  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current) return;

      try {
        setIsGenerating(true);
        setError(null);

        const mapsURL = generateGoogleMapsURL();

        const qrDataURL = await QRCode.toDataURL(mapsURL, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
          canvas.width = size;
          canvas.height = size;
          ctx.drawImage(img, 0, 0, size, size);
          setIsGenerating(false);
        };
        img.src = qrDataURL;
      } catch (err) {
        console.error('QRコード生成エラー:', err);
        setError('QRコードの生成に失敗しました');
        setIsGenerating(false);
      }
    };

    generateQRCode();
  }, [data, size, routeInfo]);

  const downloadQRCode = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `nerima-wonderland-route-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  // エラーが発生した場合、エラーメッセージを表示する
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">エラー</h3>
            <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
            {onClose && (
              <button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                閉じる
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 正常な場合はQRコードを表示する
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-2">
            📱 QRコード
          </h3>
          
          <div className="relative mb-6">
            <canvas
              ref={canvasRef}
              className="border border-gray-200 dark:border-gray-600 rounded-lg mx-auto"
            />
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">生成中...</p>
                </div>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            QRコードをスキャンするとGoogleマップアプリが開き、ルートが表示されます
          </p>
          
          {/* デバッグ用：生成されたURLを表示 */}
          <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">生成されたURL:</p>
            <p className="text-xs text-gray-700 dark:text-gray-300 break-all">
              {generateGoogleMapsURL()}
            </p>
          </div>
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={downloadQRCode}
              disabled={isGenerating}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              📥 ダウンロード
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                閉じる
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}