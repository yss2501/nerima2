'use client';

import { useState, useEffect } from 'react';
import { Spot } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import MapPicker from '@/components/MapPicker';

interface SpotEditFormProps {
  spot: Spot;
  onSave: (updatedSpot: Spot) => void;
  onCancel: () => void;
  onDelete?: (spotId: number) => void;
  isModal?: boolean;
}

export default function SpotEditForm({ spot, onSave, onCancel, onDelete, isModal = true }: SpotEditFormProps) {
  const [formData, setFormData] = useState({
    name: spot.name || '',
    address: spot.address || '',
    latitude: spot.latitude?.toString() || '',
    longitude: spot.longitude?.toString() || '',
    description: spot.description || '',
    plan: spot.plan || '',
    image_url: spot.image_url || '',
    visit_duration: spot.visit_duration?.toString() || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMap, setShowMap] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<string[]>([]);

  // プランの一覧を取得
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { api } = await import('@/lib/api');
        const response = await api.spots.getPlans();
        
        // レスポンスの構造を安全にチェック
        if (response && response.data && Array.isArray(response.data.plans)) {
          setAvailablePlans(response.data.plans);
        } else {
          console.warn('Invalid plans response structure:', response);
          // フォールバック: デフォルトのプラン
          setAvailablePlans(['観光', 'グルメ', 'ショッピング', 'レジャー', '文化体験']);
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
        // フォールバック: デフォルトのプラン
        setAvailablePlans(['観光', 'グルメ', 'ショッピング', 'レジャー', '文化体験']);
      }
    };

    fetchPlans();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '名前は必須です';
    }

    if (!formData.address.trim()) {
      newErrors.address = '住所は必須です';
    }

    if (formData.latitude && isNaN(Number(formData.latitude))) {
      newErrors.latitude = '緯度は数値で入力してください';
    }

    if (formData.longitude && isNaN(Number(formData.longitude))) {
      newErrors.longitude = '経度は数値で入力してください';
    }

    if (formData.visit_duration && (isNaN(Number(formData.visit_duration)) || Number(formData.visit_duration) < 0)) {
      newErrors.visit_duration = '滞在時間は0以上の数値で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedSpot = {
        ...spot,
        name: formData.name.trim(),
        address: formData.address.trim(),
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        description: formData.description.trim() || null,
        mood: formData.plan.trim() || null,
        image_url: formData.image_url.trim() || null,
        visit_duration: formData.visit_duration ? Number(formData.visit_duration) : null,
      };

      onSave(updatedSpot);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !window.confirm('このスポットを削除しますか？この操作は取り消せません。')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(spot.id);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString()
    }));
    // エラーをクリア
    if (errors.latitude) {
      setErrors(prev => ({ ...prev, latitude: '' }));
    }
    if (errors.longitude) {
      setErrors(prev => ({ ...prev, longitude: '' }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGeocodeAddress = async () => {
    if (!formData.address.trim()) {
      alert('住所を入力してください');
      return;
    }

    setIsGeocoding(true);
    try {
      // Nominatim APIを使用して住所を緯度経度に変換
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}&limit=1&countrycodes=jp`
      );
      
      if (!response.ok) {
        throw new Error('住所の検索に失敗しました');
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        // 緯度経度を更新
        setFormData(prev => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString()
        }));
        
        // 地図を表示して位置を確認
        setShowMap(true);
        
        alert(`住所から座標を取得しました:\n緯度: ${lat.toFixed(6)}\n経度: ${lng.toFixed(6)}\n\n地図で位置を確認してください。`);
      } else {
        // 部分一致で再検索
        const partialResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}&limit=5&countrycodes=jp`
        );
        
        if (partialResponse.ok) {
          const partialData = await partialResponse.json();
          
          if (partialData && partialData.length > 0) {
            const result = partialData[0];
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);
            
            setFormData(prev => ({
              ...prev,
              latitude: lat.toString(),
              longitude: lng.toString()
            }));
            
            setShowMap(true);
            
            alert(`近い場所を見つけました:\n${result.display_name}\n\n緯度: ${lat.toFixed(6)}\n経度: ${lng.toFixed(6)}\n\n地図で位置を確認してください。`);
          } else {
            alert('住所が見つかりませんでした。手動で座標を入力するか、より詳細な住所を入力してください。');
          }
        } else {
          alert('住所の検索に失敗しました。手動で座標を入力してください。');
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('住所の検索中にエラーが発生しました。手動で座標を入力してください。');
    } finally {
      setIsGeocoding(false);
    }
  };

  const formContent = (
    <Card className={`${showMap ? 'max-w-6xl' : 'max-w-2xl'} mx-auto`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          スポット編集
        </h2>
        <div className="flex gap-2">
          {onDelete && (
            <Button
              onClick={handleDelete}
              variant="danger"
              size="sm"
              loading={isDeleting}
              icon="🗑️"
            >
              削除
            </Button>
          )}
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
          >
            ✕
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`${showMap ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>
          {/* フォーム部分 */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="スポット名を入力"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                住所 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="住所を入力"
                />
                <Button
                  type="button"
                  onClick={handleGeocodeAddress}
                  variant="secondary"
                  size="sm"
                  loading={isGeocoding}
                  icon="🗺️"
                >
                  地図上で表示
                </Button>
              </div>
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>

            {/* 座標情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  緯度
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.latitude ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="35.123456"
                />
                {errors.latitude && <p className="text-red-500 text-sm mt-1">{errors.latitude}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  経度
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.longitude ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="139.123456"
                />
                {errors.longitude && <p className="text-red-500 text-sm mt-1">{errors.longitude}</p>}
              </div>
            </div>

            {/* 地図で指定ボタン */}
            <div className="w-full">
              <Button
                type="button"
                onClick={() => setShowMap(!showMap)}
                variant="secondary"
                size="md"
                icon="🗺️"
                className="w-full"
              >
                {showMap ? '地図を閉じる' : '地図で指定'}
              </Button>
            </div>

            {/* 詳細情報 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                説明
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="スポットの説明を入力"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  プラン
                </label>
                <select
                  value={formData.plan}
                  onChange={(e) => handleInputChange('plan', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">選択してください</option>
                  {availablePlans && availablePlans.length > 0 ? (
                    availablePlans.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="観光">観光</option>
                      <option value="グルメ">グルメ</option>
                      <option value="ショッピング">ショッピング</option>
                      <option value="レジャー">レジャー</option>
                      <option value="文化体験">文化体験</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  滞在時間（分）
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.visit_duration}
                  onChange={(e) => handleInputChange('visit_duration', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.visit_duration ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="60"
                />
                {errors.visit_duration && <p className="text-red-500 text-sm mt-1">{errors.visit_duration}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                画像URL
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* 保存ボタン */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-600">
              <Button
                type="button"
                onClick={onCancel}
                variant="secondary"
                disabled={isSaving}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSaving}
                icon="💾"
              >
                {isSaving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>

          {/* 地図部分 */}
          {showMap && (
            <div className="lg:col-span-1">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  🗺️ 地図で位置を指定
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  地図をクリックまたはマーカーをドラッグして位置を指定してください
                </p>
              </div>
              <MapPicker
                latitude={formData.latitude ? parseFloat(formData.latitude) : null}
                longitude={formData.longitude ? parseFloat(formData.longitude) : null}
                onLocationChange={handleLocationChange}
                className="h-[500px]"
              />
            </div>
          )}
        </div>
      </form>
    </Card>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className={`${showMap ? 'max-w-7xl' : 'max-w-4xl'} w-full max-h-[90vh] overflow-y-auto`}>
          {formContent}
        </div>
      </div>
    );
  }

  return formContent;
}