-- 選択リスト管理用のテーブルを作成

-- カテゴリテーブル
CREATE TABLE IF NOT EXISTS option_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR UNIQUE NOT NULL,
    display_name VARCHAR NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 項目テーブル
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

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_option_items_category ON option_items(category);
CREATE INDEX IF NOT EXISTS idx_option_items_active ON option_items(is_active);
CREATE INDEX IF NOT EXISTS idx_option_items_sort ON option_items(category, sort_order);

-- RLS (Row Level Security) 設定
ALTER TABLE option_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_items ENABLE ROW LEVEL SECURITY;

-- 公開アクセス許可ポリシー
CREATE POLICY "Enable read access for all users" ON option_categories FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON option_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON option_categories FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON option_categories FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON option_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON option_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON option_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON option_items FOR DELETE USING (true);
