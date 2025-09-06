from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal

class SpotBase(BaseModel):
    """観光スポットの基本モデル"""
    name: str = Field(..., description="スポット名")
    address: str = Field(..., description="住所")
    latitude: Optional[Decimal] = Field(None, description="緯度")
    longitude: Optional[Decimal] = Field(None, description="経度")
    description: Optional[str] = Field(None, description="おすすめコメント")
    opening_hours: Optional[Dict[str, str]] = Field(None, description="営業時間")
    tags: Optional[List[str]] = Field(None, description="タグ")
    image_id: Optional[str] = Field(None, description="スポットの写真ID")
    
    # コース生成用
    visit_duration: int = Field(60, description="滞在時間（分）")
    category: Optional[str] = Field(None, description="カテゴリ")
    price_range: Optional[str] = Field(None, description="料金帯")
    crowd_level: Optional[str] = Field(None, description="混雑度")
    
    # ユーザビリティ
    rating: Optional[Decimal] = Field(0, description="評価")
    accessibility: Optional[List[str]] = Field(None, description="アクセシビリティ")
    best_season: Optional[List[str]] = Field(None, description="ベストシーズン")
    weather_dependent: bool = Field(False, description="天候依存")
    
    # CSVアップロード用
    plan: Optional[str] = Field(None, description="プラン・目的")
    image_url: Optional[str] = Field(None, description="画像URL")

class SpotCreate(SpotBase):
    """観光スポット作成用モデル"""
    pass

class SpotUpdate(BaseModel):
    """観光スポット更新用モデル"""
    name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    description: Optional[str] = None
    opening_hours: Optional[Dict[str, str]] = None
    tags: Optional[List[str]] = None
    image_id: Optional[str] = None
    visit_duration: Optional[int] = None
    category: Optional[str] = None
    price_range: Optional[str] = None
    crowd_level: Optional[str] = None
    rating: Optional[Decimal] = None
    accessibility: Optional[List[str]] = None
    best_season: Optional[List[str]] = None
    weather_dependent: Optional[bool] = None
    plan: Optional[str] = None

class Spot(SpotBase):
    """観光スポット完全モデル"""
    id: str = Field(..., description="スポットID")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")
    is_active: bool = Field(True, description="有効/無効")

    class Config:
        from_attributes = True

class SpotResponse(BaseModel):
    """観光スポットレスポンス用モデル"""
    id: int
    name: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    plan: Optional[str] = None
    image_url: Optional[str] = None
    visit_duration: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        # mood フィールドを明示的に除外
        exclude = {"mood"}
