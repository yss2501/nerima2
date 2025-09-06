'use client';

import { useState } from 'react';
import CSVUpload from '@/components/CSVUpload';
import SpotEditForm from '@/components/SpotEditForm';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function CSVImportPage() {
  const [csvSpots, setCsvSpots] = useState<any[]>([]); // CSVから読み込んだスポットデータ
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [editingSpot, setEditingSpot] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const handleUploadSuccess = (result: any) => {
    console.log('Upload success:', result);
    setUploadResult(result);
    if (result.created_spots && result.created_spots.length > 0) {
      setCsvSpots(result.created_spots);
    }
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    setUploadResult({ success: false, message: error });
  };

  const handleSpotsLoaded = (spots: any[]) => {
    console.log('Spots loaded:', spots);
    setCsvSpots(spots);
  };

  const handleUpdateSpot = async (updatedSpot: any) => {
    try {
      const response = await api.spots.update(updatedSpot.id.toString(), updatedSpot);
      
      if (response.error) {
        console.error('Update error:', response.error);
        alert('スポットの更新に失敗しました: ' + response.error);
      } else {
        // 更新成功時はスポット一覧を更新
        setCsvSpots(csvSpots.map(spot => 
          spot.id === updatedSpot.id ? response.data : spot
        ));
        setEditingSpot(null);
        alert('スポットを更新しました');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('スポットの更新に失敗しました');
    }
  };

  const downloadTemplate = async (filename: string) => {
    try {
      const response = await fetch(`/${filename}`);
      if (!response.ok) throw new Error('ファイルの取得に失敗しました');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('ファイルのダウンロードに失敗しました');
    }
  };

  const handleDeleteSpot = async (spot: any) => {
    try {
      setDeleting(true);
      const response = await api.spots.delete(spot.id.toString());
      
      if (response.error) {
        console.error('Delete error:', response.error);
        alert('スポットの削除に失敗しました: ' + response.error);
      } else {
        // 削除成功時はスポット一覧から削除
        setCsvSpots(csvSpots.filter(s => s.id !== spot.id));
        setDeleteConfirm(null);
        alert('スポットを削除しました');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('スポットの削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout 
      title="CSVファイル管理" 
      subtitle="CSVファイルからスポットデータを一括登録・編集"
    >

      {/* CSVアップロードセクション */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          スポット一括登録
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          CSVファイルから観光スポットを一括で登録できます。
        </p>
        
        <CSVUpload
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          onSpotsLoaded={handleSpotsLoaded}
        />

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📋 CSVテンプレート
          </h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
            以下のテンプレートファイルをダウンロードして使用してください：
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => downloadTemplate('spots_template.csv')}
              variant="primary"
              size="sm"
              icon="📄"
            >
              サンプル付きテンプレート
            </Button>
            <Button
              onClick={() => downloadTemplate('spots_empty_template.csv')}
              variant="secondary"
              size="sm"
              icon="📄"
            >
              空のテンプレート
            </Button>
          </div>
        </div>
      </Card>

      {/* CSVから読み込んだスポットデータの表示 */}
      {csvSpots.length > 0 && (
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              📍 登録されたスポット ({csvSpots.length}件)
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setCsvSpots([])}
                variant="secondary"
                size="sm"
                icon="🗑️"
              >
                クリア
              </Button>
              <Button
                href="/spots"
                variant="primary"
                size="sm"
                icon="📋"
              >
                全スポット一覧
              </Button>
            </div>
          </div>
            
            {/* 登録結果サマリー */}
            {uploadResult && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✅ 登録完了
                </h3>
                <div className="text-green-800 dark:text-green-200 text-sm">
                  <p>登録成功: {uploadResult.total_spots || csvSpots.length}件</p>
                  {uploadResult.error_count > 0 && (
                    <p className="text-red-600 dark:text-red-400">
                      登録失敗: {uploadResult.error_count}件
                    </p>
                  )}
                  {uploadResult.duplicate_count > 0 && (
                    <p className="text-yellow-600 dark:text-yellow-400">
                      重複スキップ: {uploadResult.duplicate_count}件
                    </p>
                  )}
                  {uploadResult.new_plan_count > 0 && (
                    <div className="mt-2">
                      <p className="text-blue-600 dark:text-blue-400 font-semibold">
                        新規プラン追加: {uploadResult.new_plan_count}件
                      </p>
                      <div className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                        追加されたプラン: {uploadResult.new_plans?.join(', ')}
                      </div>
                    </div>
                  )}
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-red-600 dark:text-red-400">
                        エラー詳細を表示
                      </summary>
                      <ul className="mt-2 text-xs list-disc list-inside">
                        {uploadResult.errors.map((error: string, index: number) => (
                          <li key={index} className="text-red-600 dark:text-red-400">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {uploadResult.skipped_duplicates && uploadResult.skipped_duplicates.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-yellow-600 dark:text-yellow-400">
                        重複スキップ詳細を表示 ({uploadResult.duplicate_count}件)
                      </summary>
                      <ul className="mt-2 text-xs list-disc list-inside">
                        {uploadResult.skipped_duplicates.map((duplicate: any, index: number) => (
                          <li key={index} className="text-yellow-600 dark:text-yellow-400">
                            行 {duplicate.row}: "{duplicate.name}" (既存ID: #{duplicate.existing_id})
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {csvSpots.map((spot, index) => (
                <div key={spot.id || index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 relative group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {spot.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        #{spot.id}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingSpot(spot)}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="編集"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(spot)}
                          className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="削除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                      <span className="mr-2">📍</span>
                      <span>{spot.address}</span>
                    </p>
                    
                    {spot.mood && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                        <span className="mr-2">😊</span>
                        <span>{spot.mood}</span>
                      </p>
                    )}
                    
                    {spot.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {spot.description}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-500">
                      <span className="flex items-center">
                        <span className="mr-1">⏰</span>
                        {spot.visit_duration || '未設定'}分
                      </span>
                      {spot.latitude && spot.longitude && (
                        <span className="flex items-center">
                          <span className="mr-1">📍</span>
                          ({spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

      {/* 編集フォーム */}
      {editingSpot && (
        <SpotEditForm
          spot={editingSpot}
          onSave={handleUpdateSpot}
          onCancel={() => setEditingSpot(null)}
          onDelete={handleDeleteSpot}
          isModal={true}
        />
      )}

      {/* ナビゲーション */}
      <div className="flex justify-between">
        <Button
          href="/spots"
          variant="secondary"
          icon="←"
        >
          スポット一覧に戻る
        </Button>
        {csvSpots.length > 0 && (
          <Button
            href={`/route?csvSpots=${encodeURIComponent(JSON.stringify(csvSpots))}`}
            variant="primary"
            icon="→"
          >
            ルート生成ページへ ({csvSpots.length}件)
          </Button>
        )}
      </div>

      {/* 削除確認ダイアログ */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="text-red-500 text-3xl mr-3">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                スポットを削除しますか？
              </h2>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                以下のスポットを削除しようとしています：
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {deleteConfirm.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {deleteConfirm.address}
                </p>
              </div>
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                ⚠️ この操作は取り消せません
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setDeleteConfirm(null)}
                variant="secondary"
                className="flex-1"
                disabled={deleting}
              >
                キャンセル
              </Button>
              <Button
                onClick={() => handleDeleteSpot(deleteConfirm)}
                variant="danger"
                className="flex-1"
                loading={deleting}
              >
                {deleting ? '削除中...' : '削除'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}