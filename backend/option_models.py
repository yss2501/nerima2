from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class OptionItemBase(BaseModel):
    """選択リスト項目の基本モデル"""
    value: str = Field(..., description="項目の値（内部ID）")
    label: str = Field(..., description="項目の表示名")
    description: Optional[str] = Field(None, description="項目の説明")
    sort_order: int = Field(0, description="並び順")
    is_active: bool = Field(True, description="有効/無効")

class OptionItemCreate(OptionItemBase):
    """選択リスト項目作成用モデル"""
    pass

class OptionItemUpdate(BaseModel):
    """選択リスト項目更新用モデル"""
    value: Optional[str] = None
    label: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class OptionItem(OptionItemBase):
    """選択リスト項目完全モデル"""
    id: str = Field(..., description="項目ID")
    category: str = Field(..., description="カテゴリ（category, price_range, etc.）")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    class Config:
        from_attributes = True

class OptionCategoryBase(BaseModel):
    """選択リストカテゴリの基本モデル"""
    name: str = Field(..., description="カテゴリ名")
    display_name: str = Field(..., description="表示名")
    description: Optional[str] = Field(None, description="説明")
    is_active: bool = Field(True, description="有効/無効")

class OptionCategoryCreate(OptionCategoryBase):
    """選択リストカテゴリ作成用モデル"""
    pass

class OptionCategoryUpdate(BaseModel):
    """選択リストカテゴリ更新用モデル"""
    display_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class OptionCategory(OptionCategoryBase):
    """選択リストカテゴリ完全モデル"""
    id: str = Field(..., description="カテゴリID")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    class Config:
        from_attributes = True

class OptionCategoryWithItems(OptionCategory):
    """項目付きカテゴリモデル"""
    items: List[OptionItem] = Field(default_factory=list, description="カテゴリ内の項目リスト")

# デフォルトの選択リストカテゴリ
DEFAULT_OPTION_CATEGORIES = [
    {
        "name": "category",
        "display_name": "カテゴリ",
        "description": "観光スポットのカテゴリ分類",
        "items": [
            {"value": "temple", "label": "寺院・神社", "sort_order": 1},
            {"value": "museum", "label": "美術館・博物館", "sort_order": 2},
            {"value": "park", "label": "公園", "sort_order": 3},
            {"value": "shopping", "label": "ショッピング", "sort_order": 4},
            {"value": "restaurant", "label": "レストラン・グルメ", "sort_order": 5},
            {"value": "entertainment", "label": "エンターテイメント", "sort_order": 6},
            {"value": "nature", "label": "自然・景色", "sort_order": 7},
            {"value": "culture", "label": "文化・歴史", "sort_order": 8},
            {"value": "other", "label": "その他", "sort_order": 9},
        ]
    },
    {
        "name": "price_range",
        "display_name": "料金帯",
        "description": "スポットの料金帯分類",
        "items": [
            {"value": "free", "label": "無料", "sort_order": 1},
            {"value": "low", "label": "低価格（～1,000円）", "sort_order": 2},
            {"value": "medium", "label": "中価格（1,000円～3,000円）", "sort_order": 3},
            {"value": "high", "label": "高価格（3,000円以上）", "sort_order": 4},
        ]
    },
    {
        "name": "crowd_level",
        "display_name": "混雑度",
        "description": "スポットの混雑度分類",
        "items": [
            {"value": "low", "label": "空いている", "sort_order": 1},
            {"value": "medium", "label": "普通", "sort_order": 2},
            {"value": "high", "label": "混雑している", "sort_order": 3},
        ]
    },
    {
        "name": "accessibility",
        "display_name": "アクセシビリティ",
        "description": "バリアフリー対応などのアクセシビリティ情報",
        "items": [
            {"value": "wheelchair", "label": "車椅子対応", "sort_order": 1},
            {"value": "elevator", "label": "エレベーター有り", "sort_order": 2},
            {"value": "escalator", "label": "エスカレーター有り", "sort_order": 3},
            {"value": "barrier_free", "label": "バリアフリー", "sort_order": 4},
            {"value": "sign_language", "label": "手話対応", "sort_order": 5},
            {"value": "audio_guide", "label": "音声ガイド対応", "sort_order": 6},
            {"value": "braille", "label": "点字案内有り", "sort_order": 7},
        ]
    },
    {
        "name": "best_season",
        "display_name": "ベストシーズン",
        "description": "スポットを楽しむのに最適な季節",
        "items": [
            {"value": "spring", "label": "春", "sort_order": 1},
            {"value": "summer", "label": "夏", "sort_order": 2},
            {"value": "autumn", "label": "秋", "sort_order": 3},
            {"value": "winter", "label": "冬", "sort_order": 4},
            {"value": "cherry_blossom", "label": "桜の季節", "sort_order": 5},
            {"value": "autumn_leaves", "label": "紅葉の季節", "sort_order": 6},
            {"value": "year_round", "label": "通年", "sort_order": 7},
        ]
    }
]
