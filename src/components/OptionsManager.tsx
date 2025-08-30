'use client';

import { useState, useEffect } from 'react';
import { optionsApi } from '@/lib/api';

import { 
  OptionCategory, 
  OptionItem, 
  OptionCategoryWithItems,
  OptionCategoryCreate,
  OptionCategoryUpdate,
  OptionItemCreate,
  OptionItemUpdate
} from '@/lib/api';

export default function OptionsManager() {
  const [categories, setCategories] = useState<OptionCategoryWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingCategory, setEditingCategory] = useState<OptionCategory | null>(null);
  const [editingItem, setEditingItem] = useState<OptionItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await optionsApi.categories.getAll();
      if (response.error) {
        setError(response.error);
      } else {
        const categoriesData = response.data || [];
        
        // 各カテゴリの項目を取得
        const categoriesWithItems = await Promise.all(
          categoriesData.map(async (category) => {
            try {
              const itemsResponse = await optionsApi.items.getByCategory(category.name);
              return {
                ...category,
                items: itemsResponse.data || []
              };
            } catch (err) {
              console.error(`Error loading items for category ${category.name}:`, err);
              return {
                ...category,
                items: []
              };
            }
          })
        );
        
        setCategories(categoriesWithItems);
      }
    } catch (err) {
      setError('オプションの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryAdded = (newCategory: OptionCategory) => {
    setCategories([...categories, { ...newCategory, items: [] }]);
    setShowAddCategory(false);
  };

  const handleCategoryUpdated = (updatedCategory: OptionCategory) => {
    setCategories(categories.map(cat => 
      cat.id === updatedCategory.id ? { ...cat, ...updatedCategory } : cat
    ));
    setEditingCategory(null);
  };

  const handleCategoryDeleted = async (categoryId: string) => {
    if (!confirm('このカテゴリを削除しますか？関連する項目も削除されます。')) {
      return;
    }

    try {
      const response = await optionsApi.categories.delete(categoryId);
      if (response.error) {
        alert('削除に失敗しました: ' + response.error);
        return;
      }
      
      setCategories(categories.filter(cat => cat.id !== categoryId));
      alert('カテゴリが削除されました');
    } catch (error) {
      alert('削除に失敗しました');
    }
  };

  const handleItemAdded = (newItem: OptionItem) => {
    setCategories(categories.map(cat => 
      cat.name === newItem.category 
        ? { ...cat, items: [...cat.items, newItem] }
        : cat
    ));
    setShowAddItem(false);
  };

  const handleItemUpdated = (updatedItem: OptionItem) => {
    setCategories(categories.map(cat => 
      cat.name === updatedItem.category
        ? { 
            ...cat, 
            items: cat.items.map(item => 
              item.id === updatedItem.id ? updatedItem : item
            )
          }
        : cat
    ));
    setEditingItem(null);
  };

  const handleItemDeleted = async (itemId: string) => {
    if (!confirm('この項目を削除しますか？')) {
      return;
    }

    try {
      const response = await optionsApi.items.delete(itemId);
      if (response.error) {
        alert('削除に失敗しました: ' + response.error);
        return;
      }
      
      setCategories(categories.map(cat => ({
        ...cat,
        items: cat.items.filter(item => item.id !== itemId)
      })));
      alert('項目が削除されました');
    } catch (error) {
      alert('削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">オプションを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-lg mb-4">❌ {error}</p>
        <button
          onClick={loadOptions}
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
            <h2 className="text-2xl font-bold text-gray-900">オプション管理</h2>
            <p className="text-gray-600">カテゴリ、料金帯、混雑度などの選択肢を管理します</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setShowAddCategory(!showAddCategory);
                setShowAddItem(false);
                setEditingCategory(null);
                setEditingItem(null);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>📁</span>
              {showAddCategory ? 'フォームを閉じる' : 'カテゴリを追加'}
            </button>
            <button
              onClick={() => {
                setShowAddItem(!showAddItem);
                setShowAddCategory(false);
                setEditingCategory(null);
                setEditingItem(null);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>➕</span>
              {showAddItem ? 'フォームを閉じる' : '項目を追加'}
            </button>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{categories.length}</div>
            <div className="text-purple-600 text-sm">カテゴリ数</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {categories.reduce((total, cat) => total + (cat.items?.length || 0), 0)}
            </div>
            <div className="text-blue-600 text-sm">総項目数</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {categories.length > 0 ? Math.round(categories.reduce((total, cat) => total + (cat.items?.length || 0), 0) / categories.length) : 0}
            </div>
            <div className="text-green-600 text-sm">平均項目数</div>
          </div>
        </div>
      </div>

      {/* カテゴリ一覧 */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            カテゴリ一覧 ({categories.length}件)
          </h3>
        </div>
        
        {categories.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-lg">カテゴリがまだ追加されていません</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {categories.map((category) => (
              <div key={category.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                                         <h4 className="text-lg font-semibold text-gray-900">{category.display_name}</h4>
                    {category.description && (
                      <p className="text-gray-600 text-sm mt-1">{category.description}</p>
                    )}
                                         <p className="text-gray-500 text-xs mt-2">
                       項目数: {category.items?.length || 0} | 
                       作成日: {new Date(category.created_at).toLocaleDateString('ja-JP')}
                     </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setShowAddCategory(false);
                        setShowAddItem(false);
                        setEditingItem(null);
                      }}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleCategoryDeleted(category.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>

                {/* 項目一覧 */}
                <div className="ml-4">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-md font-medium text-gray-700">項目一覧</h5>
                    <button
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setShowAddItem(true);
                        setShowAddCategory(false);
                        setEditingCategory(null);
                        setEditingItem(null);
                      }}
                      className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                    >
                      項目を追加
                    </button>
                  </div>
                  
                                     {!category.items || category.items.length === 0 ? (
                     <p className="text-gray-500 text-sm">項目がありません</p>
                   ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {category.items.map((item) => (
                        <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                                                             <p className="font-medium text-gray-900">{item.label}</p>
                              <p className="text-gray-600 text-sm">値: {item.value}</p>
                              <p className="text-gray-500 text-xs">順序: {item.sort_order}</p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setShowAddCategory(false);
                                  setShowAddItem(false);
                                  setEditingCategory(null);
                                }}
                                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                              >
                                編集
                              </button>
                              <button
                                onClick={() => handleItemDeleted(item.id)}
                                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                              >
                                削除
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 追加・編集フォームのプレースホルダー */}
      {(showAddCategory || showAddItem || editingCategory || editingItem) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              フォーム機能は別コンポーネントで実装されています。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
