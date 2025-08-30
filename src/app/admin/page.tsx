'use client';

import { useState, useEffect } from 'react';
import { api, Spot } from '@/lib/api';
import dynamic from 'next/dynamic';

// AddSpotFormを動的インポート（必要な場合のみ読み込み）
const AddSpotForm = dynamic(() => import('@/components/AddSpotForm'), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-2 text-gray-600 dark:text-gray-400">フォームを読み込み中...</p>
    </div>
  ),
});

// EditSpotFormを動的インポート
const EditSpotForm = dynamic(() => import('@/components/EditSpotForm'), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-2 text-gray-600 dark:text-gray-400">編集フォームを読み込み中...</p>
    </div>
  ),
});

export default function AdminPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadSpots();
  }, []);

  const loadSpots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.spots.getAll();
      if (response.error) {
        setError(response.error);
      } else {
        setSpots(response.data || []);
      }
    } catch (err) {
      setError('観光スポットの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSpotAdded = (newSpot: Spot) => {
    setSpots([newSpot, ...spots]);
    setShowAddForm(false);
  };

  const handleSpotUpdated = (updatedSpot: Spot) => {
    setSpots(spots.map(spot => spot.id === updatedSpot.id ? updatedSpot : spot));
    setEditingSpot(null);
  };

  const handleEditSpot = (spot: Spot) => {
    setEditingSpot(spot);
    setShowAddForm(false);
  };

  const handleDeleteSpot = async (spotId: string) => {
    if (!confirm('このスポットを削除しますか？')) {
      return;
    }

    try {
      const response = await api.spots.delete(spotId);
      if (response.error) {
        alert('削除に失敗しました: ' + response.error);
        return;
      }
      
      setSpots(spots.filter(spot => spot.id !== spotId));
      alert('スポットが削除されました');
    } catch (error) {
      alert('削除に失敗しました');
    }
  };

  const handleToggleActive = async (spot: Spot) => {
    try {
      const response = await api.spots.update(spot.id, {
        is_active: !spot.is_active
      });
      
      if (response.error) {
        alert('更新に失敗しました: ' + response.error);
        return;
      }
      
      setSpots(spots.map(s => s.id === spot.id ? { ...s, is_active: !s.is_active } : s));
      alert('スポットの状態が更新されました');
    } catch (error) {
      alert('更新に失敗しました');
    }
  };

  // フィルタリング
  const filteredSpots = spots.filter(spot => {
    const matchesSearch = !searchTerm || 
      spot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spot.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (spot.description && spot.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedCategory || spot.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-green-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white text-lg">練馬スポットを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-green-700 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">❌ {error}</p>
          <button
            onClick={loadSpots}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-green-700 relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-black/5"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 min-h-screen">
        {/* ナビゲーションバー */}
        <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <a href="/" className="text-white font-bold text-xl hover:text-white/80 transition-colors">
              🌱 練馬ワンダーランド
            </a>
            <div className="flex gap-4">
              <a href="/route" className="text-white/80 hover:text-white transition-colors">
                ルート生成
              </a>
              <a href="/options" className="text-white/80 hover:text-white transition-colors">
                設定
              </a>
            </div>
          </div>
        </nav>
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* ヘッダー */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              🌱 練馬スポット
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                管理システム
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-3xl mx-auto">
              練馬区の魅力的な観光スポットを管理・追加・編集できます
            </p>
            
            {/* 統計情報 */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
                <div className="text-2xl font-bold text-white">{filteredSpots.length}</div>
                <div className="text-white/80 text-sm">練馬スポット</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
                <div className="text-2xl font-bold text-white">{new Set(spots.map(s => s.category).filter(Boolean)).size}</div>
                <div className="text-white/80 text-sm">カテゴリ</div>
              </div>
              <a
                href="/options"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
              >
                🗂️ 選択リスト管理
              </a>
            </div>
          </div>

          {/* アクションバー */}
          <div className="mb-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* 検索 */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="練馬スポット名、住所、説明で検索..."
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-white placeholder-white/70"
                  />
                </div>
                
                {/* カテゴリフィルター */}
                <div className="min-w-[200px]">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-white"
                  >
                    <option value="">全カテゴリ</option>
                    <option value="temple">寺院・神社</option>
                    <option value="museum">美術館・博物館</option>
                    <option value="park">公園</option>
                    <option value="shopping">ショッピング</option>
                    <option value="restaurant">レストラン・グルメ</option>
                    <option value="entertainment">エンターテイメント</option>
                    <option value="nature">自然・景色</option>
                    <option value="culture">文化・歴史</option>
                    <option value="other">その他</option>
                  </select>
                </div>
              </div>
              
              {/* 新規追加ボタン */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddForm(!showAddForm);
                    setEditingSpot(null);
                  }}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  <span>➕</span>
                  {showAddForm ? 'フォームを閉じる' : '練馬スポットを追加'}
                </button>
                
                {editingSpot && (
                  <button
                    onClick={() => setEditingSpot(null)}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <span>✖️</span>
                    編集をキャンセル
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 詳細統計情報 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-yellow-300">{spots.length}</div>
              <div className="text-white/80 text-sm">総スポット数</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-300">
                {spots.filter(s => s.is_active).length}
              </div>
              <div className="text-white/80 text-sm">有効なスポット</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-red-300">
                {spots.filter(s => !s.is_active).length}
              </div>
              <div className="text-white/80 text-sm">無効なスポット</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-300">
                {filteredSpots.length}
              </div>
              <div className="text-white/80 text-sm">表示中</div>
            </div>
          </div>

          {/* 追加フォーム */}
          {showAddForm && (
            <div className="mb-8 animate-slide-up">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl p-2">
                <AddSpotForm 
                  onSpotAdded={handleSpotAdded}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            </div>
          )}

          {/* 編集フォーム */}
          {editingSpot && (
            <div className="mb-8 animate-bounce-in">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl p-2">
                <EditSpotForm
                  spot={editingSpot}
                  onSpotUpdated={handleSpotUpdated}
                  onCancel={() => setEditingSpot(null)}
                />
              </div>
            </div>
          )}

          {/* スポット一覧 */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl">
            <div className="p-6 border-b border-white/20">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">🌱</span>
                スポット一覧 ({filteredSpots.length}件)
              </h2>
            </div>
            
            {filteredSpots.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-white/70 text-lg">
                  {searchTerm || selectedCategory ? '検索条件に一致する練馬スポットが見つかりません' : '練馬スポットがまだ追加されていません'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/20 backdrop-blur-md">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                        画像
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                        スポット名
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                        住所
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                        カテゴリ
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                        評価
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                        状態
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                        アクション
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/5 backdrop-blur-md divide-y divide-white/20">
                    {filteredSpots.map((spot) => (
                      <tr key={spot.id} className="hover:bg-white/10 transition-colors text-white">
                        {/* 画像 */}
                        <td className="px-4 py-4">
                          <div className="w-16 h-16">
                            {spot.image_id ? (
                              <img
                                src={`/api/images/${spot.image_id}`}
                                alt={spot.name}
                                className="w-full h-full object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                                onError={(e) => {
                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzMkMyNCAyOC42ODYyIDI2LjY4NjIgMjYgMzAgMjZDMzMuMzEzOCAyNiAzNiAyOC42ODYyIDM2IDMyQzM2IDM1LjMxMzggMzMuMzEzOCAzOCAzMCAzOEMyNi42ODYyIDM4IDI0IDM1LjMxMzggMjQgMzJaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yMCA0NEw0MCA0NFY0MkwzNiAzOEwyOCAzMEwyMCAzOFY0NFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400 dark:text-gray-500 text-xs">画像なし</span>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* スポット名 */}
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {spot.name}
                            </div>
                            {spot.description && (
                              <div className="text-sm text-white/70 truncate max-w-xs">
                                {spot.description}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* 住所 */}
                        <td className="px-4 py-4 text-sm text-white">
                          {spot.address}
                        </td>
                        
                        {/* カテゴリ */}
                        <td className="px-4 py-4">
                          {spot.category && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              {spot.category}
                            </span>
                          )}
                        </td>
                        
                        {/* 評価 */}
                        <td className="px-4 py-4 text-sm text-white">
                          {spot.rating ? `⭐ ${spot.rating}` : '-'}
                        </td>
                        
                        {/* 状態 */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              spot.is_active
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}
                          >
                            {spot.is_active ? '有効' : '無効'}
                          </span>
                        </td>
                        
                        {/* アクション */}
                        <td className="px-4 py-4 text-sm space-x-2">
                          <button
                            onClick={() => handleEditSpot(spot)}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleToggleActive(spot)}
                            className={`px-3 py-1 rounded text-white text-xs ${
                              spot.is_active
                                ? 'bg-orange-500 hover:bg-orange-600'
                                : 'bg-green-500 hover:bg-green-600'
                            } transition-colors`}
                          >
                            {spot.is_active ? '無効化' : '有効化'}
                          </button>
                          <button
                            onClick={() => handleDeleteSpot(spot.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
