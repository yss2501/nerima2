'use client';

import { useState, useEffect } from 'react';
import { 
  optionsApi, 
  OptionCategory, 
  OptionCategoryWithItems, 
  OptionItem, 
  OptionItemCreate, 
  OptionItemUpdate 
} from '@/lib/api';

export default function OptionsManager() {
  const [categories, setCategories] = useState<OptionCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<OptionCategoryWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // 項目編集用の状態
  const [editingItem, setEditingItem] = useState<OptionItem | null>(null);
  const [newItem, setNewItem] = useState<OptionItemCreate>({
    value: '',
    label: '',
    description: '',
    sort_order: 0,
    is_active: true
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await optionsApi.categories.getAll();
      if (response.error) {
        setError(response.error);
      } else {
        setCategories(response.data || []);
      }
    } catch (err) {
      setError('カテゴリの読み込みに失敗しました');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryWithItems = async (categoryName: string) => {
    try {
      const response = await optionsApi.categories.getWithItems(categoryName);
      if (response.error) {
        setError(response.error);
      } else {
        setSelectedCategory(response.data);
      }
    } catch (err) {
      setError('カテゴリの詳細読み込みに失敗しました');
      console.error('Error loading category details:', err);
    }
  };

  const handleAddItem = async () => {
    if (!selectedCategory || !newItem.value.trim() || !newItem.label.trim()) {
      setError('値と表示名は必須です');
      return;
    }

    try {
      const response = await optionsApi.items.create(selectedCategory.name, {
        ...newItem,
        sort_order: newItem.sort_order || (selectedCategory.items.length + 1) * 10
      });
      
      if (response.error) {
        setError(response.error);
      } else {
        await loadCategoryWithItems(selectedCategory.name);
        setNewItem({ value: '', label: '', description: '', sort_order: 0, is_active: true });
        setShowAddForm(false);
        setError('');
      }
    } catch (err) {
      setError('項目の追加に失敗しました');
      console.error('Error adding item:', err);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      const updateData: OptionItemUpdate = {
        value: editingItem.value,
        label: editingItem.label,
        description: editingItem.description,
        sort_order: editingItem.sort_order,
        is_active: editingItem.is_active
      };

      const response = await optionsApi.items.update(editingItem.id, updateData);
      
      if (response.error) {
        setError(response.error);
      } else {
        await loadCategoryWithItems(selectedCategory!.name);
        setEditingItem(null);
        setError('');
      }
    } catch (err) {
      setError('項目の更新に失敗しました');
      console.error('Error updating item:', err);
    }
  };

  const handleDeleteItem = async (itemId: string, itemLabel: string) => {
    if (!confirm(`「${itemLabel}」を削除しますか？`)) return;

    try {
      const response = await optionsApi.items.delete(itemId);
      
      if (response.error) {
        setError(response.error);
      } else {
        await loadCategoryWithItems(selectedCategory!.name);
        setError('');
      }
    } catch (err) {
      setError('項目の削除に失敗しました');
      console.error('Error deleting item:', err);
    }
  };

  const handleReorderItems = async (dragIndex: number, hoverIndex: number) => {
    if (!selectedCategory) return;

    const draggedItem = selectedCategory.items[dragIndex];
    const newItems = [...selectedCategory.items];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, draggedItem);

    // 新しい並び順を計算
    const itemOrders = newItems.map((item, index) => ({
      id: item.id,
      sort_order: (index + 1) * 10
    }));

    try {
      const response = await optionsApi.items.reorder(selectedCategory.name, itemOrders);
      
      if (response.error) {
        setError(response.error);
      } else {
        await loadCategoryWithItems(selectedCategory.name);
        setError('');
      }
    } catch (err) {
      setError('並び順の変更に失敗しました');
      console.error('Error reordering items:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg text-gray-600 dark:text-gray-400">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
          🗂️ 選択リスト
          <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
            管理システム
          </span>
        </h1>
        <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-3xl mx-auto">
          練馬スポット登録・編集フォームで使用する選択リストの項目を管理します
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-400/50 text-red-200 rounded-2xl backdrop-blur-md">
          ❌ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* カテゴリ一覧 */}
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">📂</span> カテゴリ一覧
            </h2>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => loadCategoryWithItems(category.name)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedCategory?.name === category.name
                      ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-200'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="font-medium">{category.display_name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {category.name}
                  </div>
                  {category.description && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {category.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 項目管理 */}
        <div className="lg:col-span-2">
          {selectedCategory ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  📝 {selectedCategory.display_name} の項目管理
                </h2>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  {showAddForm ? 'キャンセル' : '➕ 項目追加'}
                </button>
              </div>

              {/* 新規項目追加フォーム */}
              {showAddForm && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
                  <h3 className="text-lg font-medium text-green-900 dark:text-green-200 mb-3">
                    新しい項目を追加
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                        値（内部ID）<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newItem.value}
                        onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                        className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="例: temple"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                        表示名<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newItem.label}
                        onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                        className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="例: 寺院・神社"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                        説明
                      </label>
                      <input
                        type="text"
                        value={newItem.description || ''}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="項目の説明（任意）"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                        並び順
                      </label>
                      <input
                        type="number"
                        value={newItem.sort_order || 0}
                        onChange={(e) => setNewItem({ ...newItem, sort_order: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newItem.is_active}
                        onChange={(e) => setNewItem({ ...newItem, is_active: e.target.checked })}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label className="ml-2 block text-sm text-green-800 dark:text-green-300">
                        有効にする
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleAddItem}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      追加
                    </button>
                  </div>
                </div>
              )}

              {/* 項目一覧 */}
              <div className="space-y-3">
                {selectedCategory.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    この カテゴリには項目がありません
                  </div>
                ) : (
                  selectedCategory.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex-1">
                        {editingItem?.id === item.id ? (
                          // 編集モード
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <input
                              type="text"
                              value={editingItem.value}
                              onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                              placeholder="値"
                            />
                            <input
                              type="text"
                              value={editingItem.label}
                              onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                              placeholder="表示名"
                            />
                            <input
                              type="text"
                              value={editingItem.description || ''}
                              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                              placeholder="説明"
                            />
                            <input
                              type="number"
                              value={editingItem.sort_order}
                              onChange={(e) => setEditingItem({ ...editingItem, sort_order: parseInt(e.target.value) || 0 })}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                              placeholder="並び順"
                            />
                          </div>
                        ) : (
                          // 表示モード
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">値</div>
                              <div className="font-mono text-sm">{item.value}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">表示名</div>
                              <div className="font-medium">{item.label}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">説明</div>
                              <div className="text-sm">{item.description || '―'}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">並び順</div>
                              <div className="text-sm">{item.sort_order}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          item.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                        }`}>
                          {item.is_active ? '有効' : '無効'}
                        </div>

                        {editingItem?.id === item.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateItem}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                            >
                              キャンセル
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id, item.label)}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                            >
                              削除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-4">📂</div>
                <div className="text-lg">カテゴリを選択してください</div>
                <div className="text-sm mt-2">左側のカテゴリ一覧から編集したいカテゴリをクリックしてください</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
