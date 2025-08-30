import { useState, useEffect } from 'react';
import { optionsApi, OptionItem } from '@/lib/api';

export interface OptionSelect {
  value: string;
  label: string;
  description?: string;
}

export function useOptions(categoryName: string) {
  const [options, setOptions] = useState<OptionSelect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadOptions();
  }, [categoryName]);

  const loadOptions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await optionsApi.items.getByCategory(categoryName);
      
      if (response.error) {
        setError(response.error);
        setOptions([]);
      } else {
        // 有効な項目のみを抽出してソート
        const activeItems = (response.data || [])
          .filter((item: OptionItem) => item.is_active)
          .sort((a: OptionItem, b: OptionItem) => a.sort_order - b.sort_order);
        
        const optionsList: OptionSelect[] = activeItems.map((item: OptionItem) => ({
          value: item.value,
          label: item.label,
          description: item.description,
        }));
        
        setOptions(optionsList);
      }
    } catch (err) {
      console.error(`Error loading options for ${categoryName}:`, err);
      setError(`選択リスト（${categoryName}）の読み込みに失敗しました`);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshOptions = () => {
    loadOptions();
  };

  return {
    options,
    loading,
    error,
    refreshOptions,
  };
}

// 複数カテゴリの選択リストを管理するフック
export function useMultipleOptions(categoryNames: string[]) {
  const [allOptions, setAllOptions] = useState<Record<string, OptionSelect[]>>({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAllOptions();
  }, [categoryNames.join(',')]);

  const loadAllOptions = async () => {
    try {
      setLoading(true);
      setErrors({});
      
      const promises = categoryNames.map(async (categoryName) => {
        try {
          const response = await optionsApi.items.getByCategory(categoryName);
          
          if (response.error) {
            setErrors(prev => ({ ...prev, [categoryName]: response.error! }));
            return { categoryName, options: [] };
          }
          
          const activeItems = (response.data || [])
            .filter((item: OptionItem) => item.is_active)
            .sort((a: OptionItem, b: OptionItem) => a.sort_order - b.sort_order);
          
          const optionsList: OptionSelect[] = activeItems.map((item: OptionItem) => ({
            value: item.value,
            label: item.label,
            description: item.description,
          }));
          
          return { categoryName, options: optionsList };
        } catch (err) {
          console.error(`Error loading options for ${categoryName}:`, err);
          setErrors(prev => ({ 
            ...prev, 
            [categoryName]: `選択リスト（${categoryName}）の読み込みに失敗しました` 
          }));
          return { categoryName, options: [] };
        }
      });

      const results = await Promise.all(promises);
      
      const optionsMap: Record<string, OptionSelect[]> = {};
      results.forEach(({ categoryName, options }) => {
        optionsMap[categoryName] = options;
      });
      
      setAllOptions(optionsMap);
    } catch (err) {
      console.error('Error loading multiple options:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAllOptions = () => {
    loadAllOptions();
  };

  const getOptions = (categoryName: string): OptionSelect[] => {
    return allOptions[categoryName] || [];
  };

  return {
    allOptions,
    loading,
    errors,
    refreshAllOptions,
    getOptions,
  };
}
