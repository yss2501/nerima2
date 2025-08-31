

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nerima-back.onrender.com';

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

// 観光スポットの型定義
export interface Spot {
  id: string;
  name: string;
  address: string;
  latitude?: string;
  longitude?: string;
  description?: string;
  opening_hours?: Record<string, string>;
  tags?: string[];
  image_id?: string;
  visit_duration: number;
  category?: string;
  price_range?: string;
  crowd_level?: string;
  rating?: string;
  accessibility?: string[];
  best_season?: string[];
  weather_dependent: boolean;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface SpotCreate {
  name: string;
  address: string;
  latitude?: string;
  longitude?: string;
  description?: string;
  opening_hours?: Record<string, string>;
  tags?: string[];
  image_id?: string;
  visit_duration?: number;
  category?: string;
  price_range?: string;
  crowd_level?: string;
  rating?: string;
  accessibility?: string[];
  best_season?: string[];
  weather_dependent?: boolean;
}

export interface SpotUpdate {
  name?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  description?: string;
  opening_hours?: Record<string, string>;
  tags?: string[];
  image_id?: string;
  visit_duration?: number;
  category?: string;
  price_range?: string;
  crowd_level?: string;
  rating?: string;
  accessibility?: string[];
  best_season?: string[];
  weather_dependent?: boolean;
  is_active?: boolean;
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
    getById: (id: string) => apiClient.get<Spot>(`/api/spots/${id}`),
    create: (spot: SpotCreate) => apiClient.post<Spot>('/api/spots', spot),
    update: (id: string, spot: SpotUpdate) => apiClient.put<Spot>(`/api/spots/${id}`, spot),
    delete: (id: string) => apiClient.delete(`/api/spots/${id}`),
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
