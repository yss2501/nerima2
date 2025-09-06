'use client';

import { useState, useRef, useEffect } from 'react';
import { api, SpotCreate } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { geocodeAddress, selectBestGeocodeResult, isValidJapaneseCoordinates, GeocodeResult } from '@/lib/geocoding';
import { useMultipleOptions, OptionSelect } from '@/hooks/useOptions';

// フォーム専用の型定義
interface SpotFormData {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  latitudeStr?: string;
  longitudeStr?: string;
  description?: string;
  mood?: string;
  image_url?: string;
  visit_duration?: number;
  // フォーム専用の追加プロパティ
  opening_hours?: any;
  tags?: string[];
  category?: string;
  price_range?: string;
  crowd_level?: string;
  rating?: string;
  accessibility?: string[];
  best_season?: string[];
  weather_dependent?: boolean;
}

interface AddSpotFormProps {
  onSpotAdded?: (spot: any) => void;
  onCancel?: () => void;
}

export default function AddSpotForm({ onSpotAdded, onCancel }: AddSpotFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 動的選択リストの読み込み
  const { 
    allOptions, 
    loading: optionsLoading, 
    errors: optionsErrors, 
    getOptions 
  } = useMultipleOptions(['category', 'price_range', 'crowd_level']);
  
  const [formData, setFormData] = useState<SpotFormData>({
    name: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    latitudeStr: '',
    longitudeStr: '',
    description: '',
    opening_hours: {},
    tags: [],
    visit_duration: 60,
    category: '',
    price_range: '',
    crowd_level: '',
    rating: '',
    accessibility: [],
    best_season: [],
    weather_dependent: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');
  const [accessibilityInput, setAccessibilityInput] = useState('');
  const [seasonInput, setSeasonInput] = useState('');

  // ジオコーディング関連の状態
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeResults, setGeocodeResults] = useState<GeocodeResult[]>([]);
  const [showGeocodeResults, setShowGeocodeResults] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string>('');

  // 画像関連の状態
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'スポット名は必須です';
    }

    if (!formData.address.trim()) {
      newErrors.address = '住所は必須です';
    }

    if (formData.visit_duration && (formData.visit_duration < 1 || formData.visit_duration > 600)) {
      newErrors.visit_duration = '滞在時間は1分から600分の間で入力してください';
    }

    if (formData.rating && (parseFloat(formData.rating) < 0 || parseFloat(formData.rating) > 5)) {
      newErrors.rating = '評価は0.0から5.0の間で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 画像アップロード
  const uploadImage = async (file: File): Promise<string | undefined> => {
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('画像のアップロードに失敗しました');
      }

      const result = await response.json();
      return result.image_id;
    } catch (error) {
      console.error('Image upload error:', error);
      setErrors({ image: '画像のアップロードに失敗しました' });
      return undefined;
    } finally {
      setIsUploadingImage(false);
    }
  };

  // ファイル選択処理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ファイルサイズチェック（5MB制限）
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ image: 'ファイルサイズは5MB以下にしてください' });
        return;
      }

      // ファイル形式チェック
      if (!file.type.startsWith('image/')) {
        setErrors({ image: '画像ファイルを選択してください' });
        return;
      }

      setSelectedFile(file);
      setErrors({ ...errors, image: '' });

      // プレビュー作成
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 画像をアップロード（ファイルが選択されている場合）
      let imageId = undefined;
      if (selectedFile) {
        imageId = await uploadImage(selectedFile);
      }

      // SpotCreate型に変換
      const submitData: SpotCreate = {
        name: formData.name,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        description: formData.description,
        mood: formData.mood,
        image_url: formData.image_url,
        visit_duration: formData.visit_duration,
      };

      console.log('Submitting spot data:', submitData);
      
      const response = await api.spots.create(submitData);
      
      if (response.error) {
        setErrors({ submit: response.error });
        return;
      }

      // 成功時の処理
      if (onSpotAdded) {
        onSpotAdded(response.data);
      }
      
      // フォームリセット
      setFormData({
        name: '',
        address: '',
        latitude: undefined,
        longitude: undefined,
        latitudeStr: '',
        longitudeStr: '',
        description: '',
        opening_hours: {},
        tags: [],
        visit_duration: 60,
        category: '',
        price_range: '',
        crowd_level: '',
        rating: '',
        accessibility: [],
        best_season: [],
        weather_dependent: false,
      });
      setSelectedFile(null);
      setImagePreview(null);
      
      alert('スポットが正常に追加されました！');
      
    } catch (error) {
      console.error('Error creating spot:', error);
      setErrors({ submit: 'スポットの作成に失敗しました' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // タグ追加
  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()]
      });
      setTagInput('');
    }
  };

  // タグ削除
  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  // アクセシビリティ追加
  const addAccessibility = () => {
    if (accessibilityInput.trim() && !formData.accessibility?.includes(accessibilityInput.trim())) {
      setFormData({
        ...formData,
        accessibility: [...(formData.accessibility || []), accessibilityInput.trim()]
      });
      setAccessibilityInput('');
    }
  };

  // アクセシビリティ削除
  const removeAccessibility = (itemToRemove: string) => {
    setFormData({
      ...formData,
      accessibility: formData.accessibility?.filter(item => item !== itemToRemove) || []
    });
  };

  // ベストシーズン追加
  const addSeason = () => {
    if (seasonInput.trim() && !formData.best_season?.includes(seasonInput.trim())) {
      setFormData({
        ...formData,
        best_season: [...(formData.best_season || []), seasonInput.trim()]
      });
      setSeasonInput('');
    }
  };

  // ベストシーズン削除
  const removeSeason = (seasonToRemove: string) => {
    setFormData({
      ...formData,
      best_season: formData.best_season?.filter(season => season !== seasonToRemove) || []
    });
  };

  // ジオコーディング実行
  const handleGeocode = async () => {
    if (!formData.address.trim()) {
      setGeocodeError('住所を入力してください');
      return;
    }

    setIsGeocoding(true);
    setGeocodeError('');
    setGeocodeResults([]);
    setShowGeocodeResults(false);

    try {
      const response = await geocodeAddress(formData.address);
      
      if (response.error) {
        setGeocodeError(response.error);
        return;
      }

      if (response.results.length === 0) {
        setGeocodeError('住所に対応する座標が見つかりませんでした');
        return;
      }

      setGeocodeResults(response.results);

      // 結果が1つの場合は自動で選択
      if (response.results.length === 1) {
        const result = response.results[0];
        setFormData({
          ...formData,
          latitude: result.lat,
          longitude: result.lng,
          latitudeStr: result.lat.toString(),
          longitudeStr: result.lng.toString()
        });
        alert(`座標を自動取得しました！\n緯度: ${result.lat}\n経度: ${result.lng}`);
      } else {
        // 複数の結果がある場合は選択肢を表示
        setShowGeocodeResults(true);
      }

    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodeError('ジオコーディング処理中にエラーが発生しました');
    } finally {
      setIsGeocoding(false);
    }
  };

  // ジオコード結果から座標を選択
  const selectGeocodeResult = (result: GeocodeResult) => {
    if (!isValidJapaneseCoordinates(result.lat, result.lng)) {
      alert('日本国外の座標のようです。正しい住所を確認してください。');
      return;
    }

    setFormData({
      ...formData,
      latitude: result.lat,
      longitude: result.lng,
      latitudeStr: result.lat.toString(),
      longitudeStr: result.lng.toString()
    });
    
    setShowGeocodeResults(false);
    alert(`座標を設定しました！\n緯度: ${result.lat}\n経度: ${result.lng}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          新しいスポットを追加
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          観光スポットの情報を入力して、データベースに追加してください。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* エラー表示 */}
        {errors.submit && (
          <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{errors.submit}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">基本情報</h3>
            
            {/* スポット名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                スポット名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="例: 東京スカイツリー"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* 住所 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                住所 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="例: 東京都墨田区押上1-1-2"
                />
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={isGeocoding || !formData.address.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  title="住所から緯度・経度を自動取得します。詳細な番地でもOK！"
                >
                  {isGeocoding ? '🔍...' : '🗺️ 座標取得'}
                </button>
              </div>
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              {geocodeError && <p className="text-red-500 text-sm mt-1">{geocodeError}</p>}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                💡 詳細な住所（例: 3丁目1番3号）でも自動変換して検索します
              </p>
            </div>

            {/* ジオコード結果選択 */}
            {showGeocodeResults && geocodeResults.length > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3">
                  🗺️ 座標の候補が見つかりました（最適なものを選択してください）
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {geocodeResults.map((result, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectGeocodeResult(result)}
                      className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-800 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {result.formatted_address}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        緯度: {result.lat.toFixed(6)}, 経度: {result.lng.toFixed(6)}
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowGeocodeResults(false)}
                  className="mt-3 px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            )}

            {/* 座標 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  緯度
                  {formData.latitude && (
                    <span className="ml-2 text-green-600 dark:text-green-400 text-xs">✅ 設定済み</span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.latitudeStr || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ 
                      ...formData, 
                      latitudeStr: value,
                      latitude: value ? parseFloat(value) : undefined
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="35.71023"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  経度
                  {formData.longitude && (
                    <span className="ml-2 text-green-600 dark:text-green-400 text-xs">✅ 設定済み</span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.longitudeStr || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ 
                      ...formData, 
                      longitudeStr: value,
                      longitude: value ? parseFloat(value) : undefined
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="139.81071"
                />
              </div>
            </div>
            
            {formData.latitude && formData.longitude && (
              <div className="p-3 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✅ 座標が設定されています: {formData.latitudeStr}, {formData.longitudeStr}
                </p>
              </div>
            )}

            {/* 説明 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                説明・おすすめコメント
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="このスポットの魅力や見どころを説明してください..."
              />
            </div>
          </div>

          {/* 詳細情報と画像 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">詳細情報</h3>

            {/* 画像アップロード */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                スポット画像
              </label>
              <div className="space-y-3">
                {/* 画像プレビュー */}
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="スポット画像プレビュー"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {/* ファイル選択 */}
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    📷 画像を選択
                  </button>
                  {isUploadingImage && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      アップロード中...
                    </span>
                  )}
                </div>
                
                {errors.image && <p className="text-red-500 text-sm">{errors.image}</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  JPG, PNG, GIF対応（最大5MB）
                </p>
              </div>
            </div>

            {/* カテゴリ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                カテゴリ
                {optionsLoading && <span className="ml-2 text-xs text-gray-500">読み込み中...</span>}
                {optionsErrors.category && <span className="ml-2 text-xs text-red-500">⚠️</span>}
              </label>
              <select
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={optionsLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                <option value="">カテゴリを選択</option>
                {getOptions('category').map((option) => (
                  <option key={option.value} value={option.value} title={option.description}>
                    {option.label}
                  </option>
                ))}
              </select>
              {optionsErrors.category && (
                <p className="text-red-500 text-xs mt-1">{optionsErrors.category}</p>
              )}
            </div>

            {/* 料金帯 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                料金帯
                {optionsLoading && <span className="ml-2 text-xs text-gray-500">読み込み中...</span>}
                {optionsErrors.price_range && <span className="ml-2 text-xs text-red-500">⚠️</span>}
              </label>
              <select
                value={formData.price_range || ''}
                onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                disabled={optionsLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                <option value="">料金帯を選択</option>
                {getOptions('price_range').map((option) => (
                  <option key={option.value} value={option.value} title={option.description}>
                    {option.label}
                  </option>
                ))}
              </select>
              {optionsErrors.price_range && (
                <p className="text-red-500 text-xs mt-1">{optionsErrors.price_range}</p>
              )}
            </div>

            {/* 混雑度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                混雑度
                {optionsLoading && <span className="ml-2 text-xs text-gray-500">読み込み中...</span>}
                {optionsErrors.crowd_level && <span className="ml-2 text-xs text-red-500">⚠️</span>}
              </label>
              <select
                value={formData.crowd_level || ''}
                onChange={(e) => setFormData({ ...formData, crowd_level: e.target.value })}
                disabled={optionsLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                <option value="">混雑度を選択</option>
                {getOptions('crowd_level').map((option) => (
                  <option key={option.value} value={option.value} title={option.description}>
                    {option.label}
                  </option>
                ))}
              </select>
              {optionsErrors.crowd_level && (
                <p className="text-red-500 text-xs mt-1">{optionsErrors.crowd_level}</p>
              )}
            </div>

            {/* 滞在時間 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                推奨滞在時間（分）
              </label>
              <input
                type="number"
                value={formData.visit_duration}
                onChange={(e) => setFormData({ ...formData, visit_duration: parseInt(e.target.value) || 60 })}
                min="1"
                max="600"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              {errors.visit_duration && <p className="text-red-500 text-sm mt-1">{errors.visit_duration}</p>}
            </div>

            {/* 評価 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                評価（0.0 - 5.0）
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating || ''}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="4.5"
              />
              {errors.rating && <p className="text-red-500 text-sm mt-1">{errors.rating}</p>}
            </div>
          </div>
        </div>

        {/* タグ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            タグ
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="タグを入力してEnterで追加"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              追加
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags?.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* アクセシビリティ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            アクセシビリティ
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={accessibilityInput}
              onChange={(e) => setAccessibilityInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAccessibility())}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="例: 車椅子対応, エレベーター有り"
            />
            <button
              type="button"
              onClick={addAccessibility}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              追加
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.accessibility?.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeAccessibility(item)}
                  className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* ベストシーズン */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            ベストシーズン
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={seasonInput}
              onChange={(e) => setSeasonInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSeason())}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="例: 春, 夏, 秋, 冬"
            />
            <button
              type="button"
              onClick={addSeason}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              追加
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.best_season?.map((season, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm"
              >
                {season}
                <button
                  type="button"
                  onClick={() => removeSeason(season)}
                  className="ml-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 天候依存 */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.weather_dependent}
              onChange={(e) => setFormData({ ...formData, weather_dependent: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              天候に依存する（雨天時は楽しめない）
            </span>
          </label>
        </div>

        {/* アクションボタン */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              キャンセル
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '追加中...' : 'スポットを追加'}
          </button>
        </div>
      </form>
    </div>
  );
}
