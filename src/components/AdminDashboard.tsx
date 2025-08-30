'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SpotManager from './SpotManager';
import OptionsManager from './OptionsManager';

interface BackendStatus {
  status: string;
  message: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/health');
      const data = await response.json();
      setBackendStatus(data);
    } catch (error) {
      setBackendStatus({
        status: 'error',
        message: 'バックエンドに接続できません'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    router.push('/admin');
  };

  const tabs = [
    { id: 'dashboard', name: 'ダッシュボード', icon: '📊' },
    { id: 'spots', name: 'スポット管理', icon: '📍' },
    { id: 'options', name: 'オプション管理', icon: '⚙️' },
    { id: 'system', name: 'システム情報', icon: '🔧' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-800">
                練馬ワンダーランド 管理画面
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Backend Status Card */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      backendStatus?.status === 'healthy' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {backendStatus?.status === 'healthy' ? '✓' : '✗'}
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">バックエンド状態</h3>
                    <p className="text-sm text-gray-500">
                      {isLoading ? '確認中...' : backendStatus?.message || '不明'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={checkBackendStatus}
                  className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  状態を更新
                </button>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">クイックアクション</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab('spots')}
                    className="w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                  >
                    📍 スポットを追加
                  </button>
                  <button
                    onClick={() => setActiveTab('options')}
                    className="w-full text-left px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200"
                  >
                    ⚙️ オプションを管理
                  </button>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">システム情報</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>フロントエンド: Next.js 15.5.2</p>
                  <p>バックエンド: FastAPI</p>
                  <p>データベース: Supabase</p>
                  <p>地図: Leaflet + Google Maps</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">最近の活動</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• 管理者ログイン</p>
                  <p>• システム状態確認</p>
                  <p>• ダッシュボード表示</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'spots' && <SpotManager />}

        {activeTab === 'options' && <OptionsManager />}

        {activeTab === 'system' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">システム情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">バックエンド接続</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">ステータス:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      backendStatus?.status === 'healthy' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {backendStatus?.status || 'unknown'}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">メッセージ:</span> 
                    <span className="ml-2 text-gray-600">
                      {backendStatus?.message || 'N/A'}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">最終確認:</span> 
                    <span className="ml-2 text-gray-600">
                      {new Date().toLocaleString('ja-JP')}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">技術スタック</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">フロントエンド:</span> Next.js 15.5.2</p>
                  <p><span className="font-medium">バックエンド:</span> FastAPI</p>
                  <p><span className="font-medium">データベース:</span> Supabase (PostgreSQL)</p>
                  <p><span className="font-medium">地図サービス:</span> Leaflet + Google Maps</p>
                  <p><span className="font-medium">認証:</span> パスワード認証</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
