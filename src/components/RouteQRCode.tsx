'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { RouteInfo } from '@/lib/api';

interface RouteQRCodeProps {
  routeInfo: RouteInfo;
}

export default function RouteQRCode({ routeInfo }: RouteQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');

  useEffect(() => {
    const generateQRCode = async () => {
      if (!routeInfo.route_points || routeInfo.route_points.length === 0) return;

      try {
        // GoogleマップのURLを生成
        const waypoints = routeInfo.route_points.map(point => 
          `${point.lat},${point.lng}`
        );
        
        // 出発地を最初に、戻り地点を最後に追加
        const startPoint = routeInfo.route_points[0];
        const endPoint = routeInfo.route_points[routeInfo.route_points.length - 1];
        
        // GoogleマップのルートURLを生成（ナビゲーション強制）
        let googleMapsUrl;
        
        // 出発地と到着地を明確に設定
        const start = `${startPoint.lat},${startPoint.lng}`;
        const end = `${endPoint.lat},${endPoint.lng}`;
        
        if (routeInfo.route_points.length > 2) {
          // 複数地点の場合：経由地を含むルート
          const waypoints = routeInfo.route_points.slice(1, -1).map(point => 
            `${point.lat},${point.lng}`
          );
          
          // 経由地をwaypointsパラメータで指定
          const waypointParam = waypoints.length > 0 ? `&waypoints=${waypoints.join('|')}` : '';
          googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${start}&destination=${end}${waypointParam}&travelmode=walking&dir_action=navigate`;
        } else {
          // 2点のみの場合：直接ルート（ナビゲーション強制）
          googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${start}&destination=${end}&travelmode=walking&dir_action=navigate`;
        }
        
        // デバッグ用にURLをコンソールに出力
        console.log('Generated Google Maps URL:', googleMapsUrl);
        console.log('Route points:', routeInfo.route_points);
        console.log('Start point:', startPoint);
        console.log('End point:', endPoint);
        
        // QRコードを生成
        const canvas = canvasRef.current;
        if (canvas) {
          const qrCodeDataURL = await QRCode.toDataURL(googleMapsUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          setQrCodeDataURL(qrCodeDataURL);
          
          // キャンバスに描画
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const img = new Image();
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = qrCodeDataURL;
          }
        }
      } catch (error) {
        console.error('QRコード生成エラー:', error);
      }
    };

    generateQRCode();
  }, [routeInfo]);

  return (
    <>
      <style jsx global>{`
        @media print {
          .qr-code-container {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            height: 100% !important;
            padding: 5mm !important;
          }
          
          .qr-code-title {
            color: black !important;
            font-size: 12px !important;
            font-weight: bold !important;
            margin-bottom: 2mm !important;
            text-align: center !important;
          }
          
          .qr-code-description {
            color: #666 !important;
            font-size: 8px !important;
            margin-bottom: 3mm !important;
            text-align: center !important;
          }
          
          .qr-code-image {
            width: 40mm !important;
            height: 40mm !important;
            border: 1px solid #333 !important;
            background: white !important;
          }
          
          .qr-code-instruction {
            color: #666 !important;
            font-size: 7px !important;
            text-align: center !important;
            margin-top: 2mm !important;
          }
        }
      `}</style>
      
      <div className="flex flex-col items-center space-y-4 qr-code-container">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2 qr-code-title">
            📱 Googleマップでナビゲーション開始
          </h3>
          <p className="text-sm text-white/80 mb-4 qr-code-description">
            QRコードをスマートフォンで読み取って、出発地から目的地までのルート案内を開始できます
          </p>
          <div className="text-xs text-white/60 mb-2">
            ※ 読み取り後、Googleマップで「案内を開始」ボタンが表示されます
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-lg">
          {qrCodeDataURL ? (
            <img 
              src={qrCodeDataURL} 
              alt="GoogleマップルートQRコード" 
              className="w-48 h-48 qr-code-image"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-500">QRコード生成中...</span>
            </div>
          )}
        </div>
        
        <div className="text-center">
          <p className="text-xs text-white/70 qr-code-instruction">
            スマートフォンのカメラアプリで<br />
            このQRコードを読み取って<br />
            Googleマップで「案内を開始」をタップしてください
          </p>
        </div>
        
        <canvas 
          ref={canvasRef} 
          width={200} 
          height={200} 
          className="hidden"
        />
      </div>
    </>
  );
}
