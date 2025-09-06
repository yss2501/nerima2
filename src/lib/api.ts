

// API設定（本番環境対応）
const getApiBaseUrl = () => {
  // 本番環境では環境変数から取得、開発環境ではデフォルト値を使用
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://your-backend-app.onrender.com';
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.1.47:8000';
};

const API_BASE_URL = getApiBaseUrl();

console.log('API_BASE_URL:', API_BASE_URL);
console.log('Environment:', process.env.NODE_ENV);

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  async delete(endpoint: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return {
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }
}

export const apiClient = new ApiClient();

// API エンドポイントの型定義
export interface HealthCheckResponse {
  status: string;
  message: string;
}

// 観光スポットの型定義（SQLite対応）
export interface Spot {
  id: number;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  mood?: string;
  image_url?: string;
  visit_duration?: number;
  // 追加のプロパティ
  rating?: string;
  category?: string;
  tags?: string[];
  price_range?: string;
  crowd_level?: string;
  best_season?: string[];
  opening_hours?: Record<string, string>;
  accessibility?: string[];
  weather_dependent?: boolean;
  plan?: string;
  image_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SpotCreate {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  mood?: string;
  image_url?: string;
  visit_duration?: number;
  // 追加のプロパティ
  rating?: string;
  category?: string;
  tags?: string[];
  price_range?: string;
  crowd_level?: string;
  best_season?: string[];
  opening_hours?: Record<string, string>;
  accessibility?: string[];
  weather_dependent?: boolean;
  plan?: string;
  image_id?: string;
}

export interface SpotUpdate {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  mood?: string;
  image_url?: string;
  visit_duration?: number;
  // 追加のプロパティ
  rating?: string;
  category?: string;
  tags?: string[];
  price_range?: string;
  crowd_level?: string;
  best_season?: string[];
  opening_hours?: Record<string, string>;
  accessibility?: string[];
  weather_dependent?: boolean;
  plan?: string;
  image_id?: string;
}

// ルート計算の型定義
export interface RoutePoint {
  lat: number;
  lng: number;
  name: string;
  distance_from_previous: number;
  travel_time: number;
  visit_duration?: number;
  visit_time?: number;
  // 追加のプロパティ
  address?: string;
  description?: string;
}

export interface RouteSummary {
  total_spots: number;
  travel_time: number;
  visit_time: number;
  return_to_start: boolean;
}

export interface RouteInfo {
  total_distance: number;
  total_time: number;
  transport_mode: string;
  route_points: RoutePoint[];
  detailed_route?: Array<{lat: number; lng: number}>; // 詳細なルートライン
  summary: RouteSummary;
}

export interface RouteResponse {
  success: boolean;
  data: RouteInfo;
}

// API 関数
export const api = {
  health: () => apiClient.get<HealthCheckResponse>('/api/health'),
  root: () => apiClient.get<{ message: string }>('/'),
  
  // 観光スポット関連
  spots: {
    getAll: (limit?: number, offset?: number) => 
      apiClient.get<Spot[]>(`/api/spots?limit=${limit || 100}&offset=${offset || 0}`),
    getSpots: () => apiClient.get<Spot[]>('/api/spots'), // SQLite対応のエンドポイント
    getById: (id: string) => apiClient.get<Spot>(`/api/spots/${id}`),
    create: (spot: SpotCreate) => apiClient.post<Spot>('/api/spots', spot),
    update: (id: string, spot: SpotUpdate) => apiClient.put<Spot>(`/api/spots/${id}`, spot),
    delete: (id: string) => apiClient.delete(`/api/spots/${id}`),
    getPlans: () => apiClient.get<{plans: string[]}>('/api/plans'),
    search: (params: {
      category?: string;
      tags?: string;
      price_range?: string;
      crowd_level?: string;
    }) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
      return apiClient.get<Spot[]>(`/api/spots/search?${searchParams.toString()}`);
    },
  },
  
  // ルート計算関連
  route: {
    calculate: (params: {
      start_lat: number;
      start_lng: number;
      spot_ids: string[];
      transport_mode: 'walking' | 'cycling' | 'driving';
      return_to_start: boolean;
      use_fallback?: boolean;
    }) => {
      const searchParams = new URLSearchParams();
      searchParams.append('start_lat', params.start_lat.toString());
      searchParams.append('start_lng', params.start_lng.toString());
      searchParams.append('spot_ids', params.spot_ids.join(','));
      searchParams.append('transport_mode', params.transport_mode);
      searchParams.append('return_to_start', params.return_to_start.toString());
      if (params.use_fallback) {
        searchParams.append('use_fallback', 'true');
      }
      return apiClient.get<RouteResponse>(`/api/route?${searchParams.toString()}`);
    },
  },
};

// 選択リスト管理用の型定義
export interface OptionItem {
  id: string;
  category: string;
  value: string;
  label: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OptionItemCreate {
  value: string;
  label: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface OptionItemUpdate {
  value?: string;
  label?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface OptionCategory {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OptionCategoryCreate {
  name: string;
  display_name: string;
  description?: string;
  is_active?: boolean;
}

export interface OptionCategoryUpdate {
  display_name?: string;
  description?: string;
  is_active?: boolean;
}

export interface OptionCategoryWithItems extends OptionCategory {
  items: OptionItem[];
}

// CSVアップロード関連API
export const csvApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('Making request to:', `${API_BASE_URL}/api/upload/csv`);
    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/upload/csv`, {
        method: 'POST',
        body: formData,
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Upload result:', result);
      return result;
    } catch (error) {
      console.error('Fetch error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  },
  
  generateRoute: async (file: File, params: {
    start_lat: number;
    start_lng: number;
    transport_mode: string;
    return_to_start: boolean;
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('start_lat', params.start_lat.toString());
    formData.append('start_lng', params.start_lng.toString());
    formData.append('transport_mode', params.transport_mode);
    formData.append('return_to_start', params.return_to_start.toString());
    
    const response = await fetch(`${API_BASE_URL}/api/csv/generate-route`, {
      method: 'POST',
      body: formData,
    });
    
    return response.json();
  },
  
  getAvailableMoods: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('Making request to:', `${API_BASE_URL}/api/csv/available-moods`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/csv/available-moods`, {
        method: 'POST',
        body: formData,
      });
      
      console.log('Moods response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Moods error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Moods result:', result);
      return result;
    } catch (error) {
      console.error('Moods fetch error:', error);
      throw error;
    }
  },
  
  generateMoodRoute: async (file: File, params: {
    mood: string;
    start_lat: number;
    start_lng: number;
    transport_mode: string;
    return_to_start: boolean;
    max_spots: number;
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mood', params.mood);
    formData.append('start_lat', params.start_lat.toString());
    formData.append('start_lng', params.start_lng.toString());
    formData.append('transport_mode', params.transport_mode);
    formData.append('return_to_start', params.return_to_start.toString());
    formData.append('max_spots', params.max_spots.toString());
    
    const response = await fetch(`${API_BASE_URL}/api/csv/generate-mood-route`, {
      method: 'POST',
      body: formData,
    });
    
    return response.json();
  },
};

// 選択リスト管理API
export const optionsApi = {
  // カテゴリ管理
  categories: {
    getAll: () => apiClient.get<OptionCategory[]>('/api/options/categories'),
    getWithItems: (categoryName: string) => 
      apiClient.get<OptionCategoryWithItems>(`/api/options/categories/${categoryName}`),
    create: (data: OptionCategoryCreate) => 
      apiClient.post<OptionCategory>('/api/options/categories', data),
    update: (categoryName: string, data: OptionCategoryUpdate) => 
      apiClient.put<OptionCategory>(`/api/options/categories/${categoryName}`, data),
    delete: (categoryName: string) => 
      apiClient.delete(`/api/options/categories/${categoryName}`),
  },
  
  // 項目管理
  items: {
    getByCategory: (categoryName: string) => 
      apiClient.get<OptionItem[]>(`/api/options/${categoryName}/items`),
    create: (categoryName: string, data: OptionItemCreate) => 
      apiClient.post<OptionItem>(`/api/options/${categoryName}/items`, data),
    update: (itemId: string, data: OptionItemUpdate) => 
      apiClient.put<OptionItem>(`/api/options/items/${itemId}`, data),
    delete: (itemId: string) => 
      apiClient.delete(`/api/options/items/${itemId}`),
    reorder: (categoryName: string, itemOrders: { id: string; sort_order: number }[]) => 
      apiClient.post(`/api/options/${categoryName}/items/reorder`, itemOrders),
  }
};
