'use client';

import { useState, useEffect } from 'react';
import { api, Spot } from '@/lib/api';
import CommonHeader from '@/components/CommonHeader';
import SpotCard from '@/components/SpotCard';
import SpotEditForm from '@/components/SpotEditForm';
import dynamic from 'next/dynamic';

// カスタムピン地図コンポーネントを動的インポート
const CustomMapPin = dynamic(() => import('@/components/CustomMapPin'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      <span className="ml-3 text-white">地図を読み込み中...</span>
    </div>
  ),
});

function SpotsPageContent() {
  // State management for spots page
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Spot | null>(null);
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    loadSpots();
  }, []);

  const loadSpots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // URLパラメータから編集モードを取得
      const urlParams = new URLSearchParams(window.location.search);
      const editMode = urlParams.get('edit') === 'true';
      setIsEditMode(editMode);
      
      const response = await api.spots.getSpots();
      if (response.error) {
        setError(response.error);
      } else {
        setSpots(response.data || []);
      }
    } catch (err) {
      console.error('スポット読み込みエラー:', err);
      setError('スポットの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSpotClick = (spot: Spot) => {
    setSelectedSpot(spot);
  };

  const handleUpdateSpot = async (updatedSpot: Spot) => {
    try {
      const response = await api.spots.update(updatedSpot.id.toString(), updatedSpot);
      setSpots(spots.map(spot =>
        spot.id === updatedSpot.id ? (response.data || spot) : spot
      ));
      setEditingSpot(null);
    } catch (err) {
      console.error('スポット更新エラー:', err);
      alert('スポットの更新に失敗しました');
    }
  };

  const handleDeleteSpot = async (spotId: number) => {
    try {
      setDeleting(true);
      await api.spots.delete(spotId.toString());
      setSpots(spots.filter(s => s.id !== spotId));
      setDeleteConfirm(null);
      setEditingSpot(null);
    } catch (err) {
      console.error('スポット削除エラー:', err);
      alert('スポットの削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-green-700 relative overflow-hidden">
        <CommonHeader />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg text-white">
              観光スポットを読み込み中...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-green-700 relative overflow-hidden">
        <CommonHeader />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
            <div className="text-red-300 text-4xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-white mb-4">
              エラーが発生しました
            </h2>
            <p className="text-white/80 mb-6">{error}</p>
            <button
              onClick={loadSpots}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
            >
              🔄 再試行
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-green-700 relative overflow-hidden">
      <CommonHeader />
      
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-black/5"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

      {/* メインコンテンツ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            📍 観光スポット一覧
          </h1>
          <p className="text-lg text-white/90 mb-6">
            練馬区の観光スポットを確認{isEditMode ? '・編集' : ''}できます
          </p>
          
          {isEditMode && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-200 text-sm">
                ⚙️ 管理モード: スポットの編集・削除が可能です
              </p>
            </div>
          )}
          
          {/* 表示切り替えボタン */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setViewMode('list')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              📋 リスト表示
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                viewMode === 'map'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              🗺️ 地図表示
            </button>
          </div>
        </div>

        {/* スポット一覧表示 */}
        {viewMode === 'list' && (
          <>
            {spots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {spots.map((spot) => (
                  <div key={spot.id} className="relative group">
                    <SpotCard
                      spot={spot}
                      onClick={handleSpotClick}
                    />
                    {isEditMode && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSpot(spot);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
                          title="編集"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(spot);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                          title="削除"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
                <div className="text-white/60 text-6xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  観光スポットが見つかりません
                </h3>
                <p className="text-white/80 mb-6">
                  現在、登録されている観光スポットはありません
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/csv"
                    className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
                  >
                    📄 CSVでスポット登録
                  </a>
                  <a
                    href="/"
                    className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
                  >
                    🏠 ホームに戻る
                  </a>
                </div>
              </div>
            )}
          </>
        )}

        {/* 地図表示 */}
        {viewMode === 'map' && (
          <CustomMapPin
            spots={spots}
            onSpotClick={handleSpotClick}
          />
        )}

        {/* 編集フォーム */}
        {editingSpot && isEditMode && (
          <SpotEditForm
            spot={editingSpot}
            onSave={handleUpdateSpot}
            onCancel={() => setEditingSpot(null)}
            onDelete={handleDeleteSpot}
            isModal={true}
          />
        )}

        {/* 削除確認ダイアログ */}
        {deleteConfirm && isEditMode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-md w-full">
              <div className="flex items-center mb-4">
                <div className="text-red-300 text-3xl mr-3">⚠️</div>
                <h2 className="text-xl font-bold text-white">
                  スポットを削除しますか？
                </h2>
              </div>
              
              <div className="mb-6">
                <p className="text-white/80 mb-2">
                  以下のスポットを削除しようとしています：
                </p>
                <div className="bg-white/10 rounded-lg p-3">
                  <h3 className="font-semibold text-white">{deleteConfirm.name}</h3>
                  <p className="text-white/70 text-sm">{deleteConfirm.address}</p>
                </div>
                <p className="text-red-300 text-sm mt-2">
                  この操作は取り消せません。
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition-all duration-300"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleDeleteSpot(deleteConfirm.id)}
                  disabled={deleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
                >
                  {deleting ? '削除中...' : '削除'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SpotsPage() {
  return <SpotsPageContent />;
}