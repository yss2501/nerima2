from typing import List, Optional, Dict, Any
from supabase import Client
from config import get_supabase_client
from models import SpotCreate, SpotUpdate, Spot
import logging

logger = logging.getLogger(__name__)

class SpotService:
    """観光スポットサービス"""
    
    def __init__(self):
        self.supabase: Client = get_supabase_client()
        self.table_name = "spots"
    
    async def get_all_spots(self, limit: int = 100, offset: int = 0) -> List[Spot]:
        """全ての観光スポットを取得"""
        try:
            response = self.supabase.table(self.table_name)\
                .select("*")\
                .eq("is_active", True)\
                .range(offset, offset + limit - 1)\
                .execute()
            
            spots = []
            for row in response.data:
                spot = Spot(**row)
                spots.append(spot)
            
            return spots
        except Exception as e:
            logger.error(f"Error fetching spots: {e}")
            raise
    
    async def get_spot_by_id(self, spot_id: str) -> Optional[Spot]:
        """IDで観光スポットを取得"""
        try:
            response = self.supabase.table(self.table_name)\
                .select("*")\
                .eq("id", spot_id)\
                .eq("is_active", True)\
                .execute()
            
            if response.data:
                return Spot(**response.data[0])
            return None
        except Exception as e:
            logger.error(f"Error fetching spot {spot_id}: {e}")
            raise
    
    async def create_spot(self, spot_data: SpotCreate) -> Spot:
        """新しい観光スポットを作成"""
        try:
            response = self.supabase.table(self.table_name)\
                .insert(spot_data.model_dump())\
                .execute()
            
            if response.data:
                return Spot(**response.data[0])
            raise Exception("Failed to create spot")
        except Exception as e:
            logger.error(f"Error creating spot: {e}")
            raise
    
    async def update_spot(self, spot_id: str, spot_data: SpotUpdate) -> Optional[Spot]:
        """観光スポットを更新"""
        try:
            # Noneでない値のみを更新
            update_data = {k: v for k, v in spot_data.model_dump().items() if v is not None}
            
            response = self.supabase.table(self.table_name)\
                .update(update_data)\
                .eq("id", spot_id)\
                .execute()
            
            if response.data:
                return Spot(**response.data[0])
            return None
        except Exception as e:
            logger.error(f"Error updating spot {spot_id}: {e}")
            raise
    
    async def delete_spot(self, spot_id: str) -> bool:
        """観光スポットを削除（論理削除）"""
        try:
            response = self.supabase.table(self.table_name)\
                .update({"is_active": False})\
                .eq("id", spot_id)\
                .execute()
            
            return len(response.data) > 0
        except Exception as e:
            logger.error(f"Error deleting spot {spot_id}: {e}")
            raise
    
    async def search_spots(self, 
                          category: Optional[str] = None,
                          tags: Optional[List[str]] = None,
                          price_range: Optional[str] = None,
                          crowd_level: Optional[str] = None) -> List[Spot]:
        """条件に基づいて観光スポットを検索"""
        try:
            query = self.supabase.table(self.table_name)\
                .select("*")\
                .eq("is_active", True)
            
            if category:
                query = query.eq("category", category)
            
            if price_range:
                query = query.eq("price_range", price_range)
            
            if crowd_level:
                query = query.eq("crowd_level", crowd_level)
            
            if tags:
                # タグの配列検索
                for tag in tags:
                    query = query.contains("tags", [tag])
            
            response = query.execute()
            
            spots = []
            for row in response.data:
                spot = Spot(**row)
                spots.append(spot)
            
            return spots
        except Exception as e:
            logger.error(f"Error searching spots: {e}")
            raise

# サービスインスタンス
spot_service = SpotService()
