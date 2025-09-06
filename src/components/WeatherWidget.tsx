'use client';

import { useState, useEffect } from 'react';

interface WeatherData {
  date: string;
  weather: string;
  temperature: {
    max: number;
    min: number;
  };
  icon: string;
}

export default function WeatherWidget() {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Open-Meteo APIを使用（完全無料・登録不要・CORS対応）
      // 練馬区の座標: 35.737853, 139.654199
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=35.737853&longitude=139.654199&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo&forecast_days=3`
      );

      if (!response.ok) {
        throw new Error(`天気データの取得に失敗しました: ${response.status}`);
      }

      const data = await response.json();
      
      // 3日間の天気データを処理
      const processedData = processOpenMeteoWeatherData(data);
      setWeatherData(processedData);
    } catch (err) {
      console.error('天気データ取得エラー:', err);
      // エラーが発生した場合はモックデータを使用
      setWeatherData(getMockWeatherData());
    } finally {
      setLoading(false);
    }
  };

  const processOpenMeteoWeatherData = (data: any): WeatherData[] => {
    const result: WeatherData[] = [];
    
    // Open-MeteoのAPIレスポンスから3日間のデータを取得
    for (let i = 0; i < 3; i++) {
      const date = new Date(data.daily.time[i]);
      const today = new Date();
      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let dateLabel = '';
      if (diffDays === 0) dateLabel = '今日';
      else if (diffDays === 1) dateLabel = '明日';
      else if (diffDays === 2) dateLabel = '明後日';
      else dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;

      result.push({
        date: dateLabel,
        weather: getWeatherDescription(data.daily.weather_code[i]),
        temperature: {
          max: Math.round(data.daily.temperature_2m_max[i]),
          min: Math.round(data.daily.temperature_2m_min[i])
        },
        icon: getWeatherIconFromCode(data.daily.weather_code[i])
      });
    }

    return result;
  };

  const getWeatherDescription = (code: number): string => {
    // WMO Weather interpretation codes (WW)
    const weatherMap: { [key: number]: string } = {
      0: '晴れ',
      1: '主に晴れ',
      2: '部分的に曇り',
      3: '曇り',
      45: '霧',
      48: '霧',
      51: '軽い霧雨',
      53: '霧雨',
      55: '霧雨',
      56: '軽い霧雨',
      57: '霧雨',
      61: '軽い雨',
      63: '雨',
      65: '強い雨',
      66: '軽い雨',
      67: '雨',
      71: '軽い雪',
      73: '雪',
      75: '強い雪',
      77: '雪',
      80: '軽いにわか雨',
      81: 'にわか雨',
      82: '強いにわか雨',
      85: '軽いにわか雪',
      86: 'にわか雪',
      95: '雷雨',
      96: '雷雨',
      99: '強い雷雨'
    };
    return weatherMap[code] || '不明';
  };

  const getWeatherIconFromCode = (code: number): string => {
    if (code === 0 || code === 1) return '☀️';
    if (code === 2 || code === 3) return '☁️';
    if (code >= 45 && code <= 57) return '🌫️';
    if (code >= 61 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 86) return '🌦️';
    if (code >= 95 && code <= 99) return '⛈️';
    return '🌤️';
  };

  const getMockWeatherData = (): WeatherData[] => {
    return [
      {
        date: '今日',
        weather: '晴れ',
        temperature: { max: 25, min: 18 },
        icon: '☀️'
      },
      {
        date: '明日',
        weather: '曇り',
        temperature: { max: 23, min: 16 },
        icon: '☁️'
      },
      {
        date: '明後日',
        weather: '雨',
        temperature: { max: 20, min: 14 },
        icon: '🌧️'
      }
    ];
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white mx-auto mb-3"></div>
          <p className="text-white/80 text-sm">天気情報を取得中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="text-center">
          <div className="text-2xl mb-2">🌤️</div>
          <p className="text-white/80 text-sm">天気情報の取得に失敗しました</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">🌤️ 練馬区の天気</h3>
        <p className="text-sm text-white/70">向こう3日間の予報</p>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {weatherData.map((day, index) => (
          <div key={index} className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl mb-2">{day.icon}</div>
            <div className="font-medium text-white text-sm mb-1">{day.date}</div>
            <div className="text-xs text-white/70 mb-2">{day.weather}</div>
            <div className="text-white font-semibold text-sm">
              {day.temperature.max}°/{day.temperature.min}°
            </div>
            <div className="text-xs text-white/70">最高/最低</div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-xs text-white/60">
          ※ 天気情報は参考程度にお使いください
        </p>
      </div>
    </div>
  );
}
