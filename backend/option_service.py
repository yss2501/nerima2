from typing import List, Optional
import uuid
import logging
from datetime import datetime
from config import get_supabase_client
from option_models import (
    OptionCategory, OptionCategoryCreate, OptionCategoryUpdate,
    OptionItem, OptionItemCreate, OptionItemUpdate,
    OptionCategoryWithItems, DEFAULT_OPTION_CATEGORIES
)

logger = logging.getLogger(__name__)

class OptionService:
    def __init__(self):
        self.supabase = get_supabase_client()

    async def initialize_default_options(self):
        """デフォルトの選択リストを初期化"""
        try:
            # option_categories テーブルの存在確認と作成
            await self._ensure_tables_exist()
            
            # 既存のカテゴリをチェック
            existing_categories = await self.get_all_categories()
            existing_names = {cat.name for cat in existing_categories}
            
            # デフォルトカテゴリを追加
            for default_cat in DEFAULT_OPTION_CATEGORIES:
                if default_cat["name"] not in existing_names:
                    # カテゴリを作成
                    category = await self.create_category(OptionCategoryCreate(
                        name=default_cat["name"],
                        display_name=default_cat["display_name"],
                        description=default_cat["description"]
                    ))
                    
                    # 項目を作成
                    for item_data in default_cat["items"]:
                        await self.create_item(category.name, OptionItemCreate(
                            value=item_data["value"],
                            label=item_data["label"],
                            sort_order=item_data["sort_order"]
                        ))
                    
                    logger.info(f"Initialized default category: {default_cat['name']}")
            
        except Exception as e:
            logger.error(f"Error initializing default options: {e}")

    async def _ensure_tables_exist(self):
        """テーブルが存在することを確認（必要に応じて作成）"""
        try:
            # option_categories テーブル作成
            create_categories_sql = """
            CREATE TABLE IF NOT EXISTS option_categories (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR UNIQUE NOT NULL,
                display_name VARCHAR NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
            """
            
            # option_items テーブル作成
            create_items_sql = """
            CREATE TABLE IF NOT EXISTS option_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                category VARCHAR NOT NULL REFERENCES option_categories(name) ON DELETE CASCADE,
                value VARCHAR NOT NULL,
                label VARCHAR NOT NULL,
                description TEXT,
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                UNIQUE(category, value)
            );
            """
            
            # インデックス作成
            create_indexes_sql = """
            CREATE INDEX IF NOT EXISTS idx_option_items_category ON option_items(category);
            CREATE INDEX IF NOT EXISTS idx_option_items_active ON option_items(is_active);
            CREATE INDEX IF NOT EXISTS idx_option_items_sort ON option_items(category, sort_order);
            """
            
            # 実行（Supabaseのクライアントを通して）
            self.supabase.rpc('exec_sql', {'sql': create_categories_sql}).execute()
            self.supabase.rpc('exec_sql', {'sql': create_items_sql}).execute()
            self.supabase.rpc('exec_sql', {'sql': create_indexes_sql}).execute()
            
        except Exception as e:
            logger.warning(f"Could not create tables (may already exist): {e}")

    # カテゴリ管理
    async def get_all_categories(self) -> List[OptionCategory]:
        """全カテゴリを取得"""
        try:
            response = self.supabase.table('option_categories').select('*').order('name').execute()
            return [OptionCategory(**cat) for cat in response.data]
        except Exception as e:
            logger.error(f"Error getting categories: {e}")
            return []

    async def get_category_with_items(self, category_name: str) -> Optional[OptionCategoryWithItems]:
        """カテゴリと項目を取得"""
        try:
            # カテゴリ取得
            cat_response = self.supabase.table('option_categories').select('*').eq('name', category_name).execute()
            if not cat_response.data:
                return None
            
            category = OptionCategory(**cat_response.data[0])
            
            # 項目取得
            items_response = self.supabase.table('option_items').select('*').eq('category', category_name).order('sort_order').execute()
            items = [OptionItem(**item) for item in items_response.data]
            
            return OptionCategoryWithItems(**category.model_dump(), items=items)
            
        except Exception as e:
            logger.error(f"Error getting category with items: {e}")
            return None

    async def create_category(self, category_data: OptionCategoryCreate) -> OptionCategory:
        """カテゴリを作成"""
        try:
            data = {
                **category_data.model_dump(),
                'id': str(uuid.uuid4()),
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            response = self.supabase.table('option_categories').insert(data).execute()
            return OptionCategory(**response.data[0])
            
        except Exception as e:
            logger.error(f"Error creating category: {e}")
            raise

    async def update_category(self, category_name: str, category_data: OptionCategoryUpdate) -> Optional[OptionCategory]:
        """カテゴリを更新"""
        try:
            update_data = {
                **{k: v for k, v in category_data.model_dump().items() if v is not None},
                'updated_at': datetime.utcnow().isoformat()
            }
            
            response = self.supabase.table('option_categories').update(update_data).eq('name', category_name).execute()
            if response.data:
                return OptionCategory(**response.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error updating category: {e}")
            raise

    async def delete_category(self, category_name: str) -> bool:
        """カテゴリを削除"""
        try:
            response = self.supabase.table('option_categories').delete().eq('name', category_name).execute()
            return len(response.data) > 0
            
        except Exception as e:
            logger.error(f"Error deleting category: {e}")
            return False

    # 項目管理
    async def get_items_by_category(self, category_name: str) -> List[OptionItem]:
        """カテゴリの項目を取得"""
        try:
            response = self.supabase.table('option_items').select('*').eq('category', category_name).order('sort_order').execute()
            return [OptionItem(**item) for item in response.data]
            
        except Exception as e:
            logger.error(f"Error getting items: {e}")
            return []

    async def create_item(self, category_name: str, item_data: OptionItemCreate) -> OptionItem:
        """項目を作成"""
        try:
            data = {
                **item_data.model_dump(),
                'id': str(uuid.uuid4()),
                'category': category_name,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            response = self.supabase.table('option_items').insert(data).execute()
            return OptionItem(**response.data[0])
            
        except Exception as e:
            logger.error(f"Error creating item: {e}")
            raise

    async def update_item(self, item_id: str, item_data: OptionItemUpdate) -> Optional[OptionItem]:
        """項目を更新"""
        try:
            update_data = {
                **{k: v for k, v in item_data.model_dump().items() if v is not None},
                'updated_at': datetime.utcnow().isoformat()
            }
            
            response = self.supabase.table('option_items').update(update_data).eq('id', item_id).execute()
            if response.data:
                return OptionItem(**response.data[0])
            return None
            
        except Exception as e:
            logger.error(f"Error updating item: {e}")
            raise

    async def delete_item(self, item_id: str) -> bool:
        """項目を削除"""
        try:
            response = self.supabase.table('option_items').delete().eq('id', item_id).execute()
            return len(response.data) > 0
            
        except Exception as e:
            logger.error(f"Error deleting item: {e}")
            return False

    async def reorder_items(self, category_name: str, item_orders: List[dict]) -> bool:
        """項目の並び順を変更"""
        try:
            for order_data in item_orders:
                await self.update_item(order_data['id'], OptionItemUpdate(sort_order=order_data['sort_order']))
            return True
            
        except Exception as e:
            logger.error(f"Error reordering items: {e}")
            return False

# グローバルインスタンス
option_service = OptionService()
