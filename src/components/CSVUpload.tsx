'use client';

import { useState } from 'react';
import { csvApi } from '@/lib/api';

interface CSVUploadProps {
  onUploadSuccess?: (result: any) => void;
  onUploadError?: (error: string) => void;
  onSpotsLoaded?: (spots: any[]) => void; // CSVから読み込んだスポットデータを渡す
}

export default function CSVUpload({
  onUploadSuccess,
  onUploadError,
  onSpotsLoaded,
}: CSVUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      onUploadError?.('CSVファイルを選択してください');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      console.log('Starting file upload');
      const result = await csvApi.upload(file);

      console.log('Upload result:', result);
      setUploadResult(result);
      onUploadSuccess?.(result);
      
      // CSVから読み込んだスポットデータを親コンポーネントに渡す
      if (result.created_spots && result.created_spots.length > 0) {
        onSpotsLoaded?.(result.created_spots);
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'アップロードに失敗しました';
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* アップロードエリア */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">
              CSVファイルを処理中...
            </p>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              CSVファイルをアップロード
            </h3>
            <p className="text-gray-600 mb-4">
              スポットデータのCSVファイルをドラッグ&ドロップまたはクリックして選択
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors"
            >
              ファイルを選択
            </label>
          </div>
        )}
      </div>

      {/* 結果表示 */}
      {uploadResult && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-green-800 font-semibold mb-2">✅ 処理完了</h4>
          <p className="text-green-700 mb-2">{uploadResult.message}</p>
          
          {uploadResult.total_spots && (
            <div className="text-sm text-green-600 mb-2">
              <p>登録成功: {uploadResult.total_spots}件</p>
              {uploadResult.error_count > 0 && (
                <p>登録失敗: {uploadResult.error_count}件</p>
              )}
              {uploadResult.duplicate_count > 0 && (
                <p className="text-yellow-600">重複スキップ: {uploadResult.duplicate_count}件</p>
              )}
            </div>
          )}
          
          {/* 重複スキップの詳細 */}
          {uploadResult.skipped_duplicates && uploadResult.skipped_duplicates.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-yellow-600 font-medium">
                重複スキップ詳細を表示 ({uploadResult.duplicate_count}件)
              </summary>
              <ul className="mt-2 text-xs text-yellow-700 list-disc list-inside">
                {uploadResult.skipped_duplicates.map((duplicate: any, index: number) => (
                  <li key={index}>
                    行 {duplicate.row}: "{duplicate.name}" (既存ID: #{duplicate.existing_id})
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* エラー表示 */}
      {uploadResult && !uploadResult.success && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-red-800 font-semibold mb-2">❌ エラー</h4>
          <p className="text-red-700 mb-2">{uploadResult.message}</p>
          {uploadResult.errors && (
            <ul className="text-sm text-red-600 list-disc list-inside">
              {uploadResult.errors.map((error: string, index: number) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ヘルプテキスト */}
      <div className="mt-4 text-sm text-gray-600">
        <p className="mb-2">
          <strong>CSVファイルの形式:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>UTF-8エンコーディングで保存</li>
          <li>必須項目: name, address</li>
          <li>推奨項目: latitude, longitude, visit_duration</li>
          <li>テンプレートファイルを参考にしてください</li>
        </ul>
      </div>
    </div>
  );
}
