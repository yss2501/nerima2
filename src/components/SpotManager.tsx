'use client';

import { useState, useEffect } from 'react';
import { api, Spot } from '@/lib/api';
import dynamic from 'next/dynamic';

// AddSpotFormを動的インポート
const AddSpotForm = dynamic(() => import('@/components/AddSpotForm'), {
  ssr: false,
  loading: () => (
    <div className="p-4 text-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
      <p className="mt-2 text-gray-600">フォームを読み込み中...</p>
    </div>
  ),
});

// EditSpotFormを動的インポート
const EditSpotForm = dynamic(() => import('@/components/EditSpotForm'), {
  ssr: false,
  loading: () => (
    <div className="p-4 text-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
      <p className="mt-2 text-gray-600">編集フォームを読み込み中...</p>
    </div>
  ),
});

export default function SpotManager() {
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
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">練馬スポットを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-lg mb-4">❌ {error}</p>
        <button
          onClick={loadSpots}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">練馬スポット管理</h2>
            <p className="text-gray-600">観光スポットの追加、編集、削除を行います</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingSpot(null);
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>➕</span>
              {showAddForm ? 'フォームを閉じる' : 'スポットを追加'}
            </button>
            
            {editingSpot && (
              <button
                onClick={() => setEditingSpot(null)}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <span>✖️</span>
                編集をキャンセル
              </button>
            )}
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{spots.length}</div>
            <div className="text-blue-600 text-sm">総スポット数</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {spots.filter(s => s.is_active).length}
            </div>
            <div className="text-green-600 text-sm">有効なスポット</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {spots.filter(s => !s.is_active).length}
            </div>
            <div className="text-red-600 text-sm">無効なスポット</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {filteredSpots.length}
            </div>
            <div className="text-purple-600 text-sm">表示中</div>
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="スポット名、住所、説明で検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="min-w-[200px]">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
        </div>
      </div>

      {/* 追加フォーム */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <AddSpotForm 
            onSpotAdded={handleSpotAdded}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* 編集フォーム */}
      {editingSpot && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <EditSpotForm
            spot={editingSpot}
            onSpotUpdated={handleSpotUpdated}
            onCancel={() => setEditingSpot(null)}
          />
        </div>
      )}

      {/* スポット一覧 */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            スポット一覧 ({filteredSpots.length}件)
          </h3>
        </div>
        
        {filteredSpots.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-lg">
              {searchTerm || selectedCategory ? '検索条件に一致するスポットが見つかりません' : 'スポットがまだ追加されていません'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    画像
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    スポット名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    住所
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    カテゴリ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    評価
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状態
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSpots.map((spot) => (
                  <tr key={spot.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="w-16 h-16">
                        {spot.image_id ? (
                          <img
                            src={`/api/images/${spot.image_id}`}
                            alt={spot.name}
                            className="w-full h-full object-cover rounded-lg border border-gray-300"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzMkMyNCAyOC42ODYyIDI2LjY4NjIgMjYgMzAgMjZDMzMuMzEzOCAyNiAzNiAyOC42ODYyIDM2IDMyQzM2IDM1LjMxMzggMzMuMzEzOCAzOCAzMCAzOEMyNi42ODYyIDM4IDI0IDM1LjMxMzggMjQgMzJaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yMCA0NEw0MCA0NFY0MkwzNiAzOEwyOCAzMEwyMCAzOFY0NFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">画像なし</span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {spot.name}
                        </div>
                        {spot.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {spot.description}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {spot.address}
                    </td>
                    
                    <td className="px-4 py-4">
                      {spot.category && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {spot.category}
                        </span>
                      )}
                    </td>
                    
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {spot.rating ? `⭐ ${spot.rating}` : '-'}
                    </td>
                    
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          spot.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {spot.is_active ? '有効' : '無効'}
                      </span>
                    </td>
                    
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
  );
}
