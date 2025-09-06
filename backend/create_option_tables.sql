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

-- updated_at を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーをテーブルに適用
CREATE TRIGGER update_option_categories_updated_at
BEFORE UPDATE ON option_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_option_items_updated_at
BEFORE UPDATE ON option_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 設定
ALTER TABLE option_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_items ENABLE ROW LEVEL SECURITY;

-- 公開アクセス許可ポリシー
CREATE POLICY "Allow public read-only access" ON option_categories FOR SELECT USING (true);
CREATE POLICY "Allow admin full access" ON option_categories FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow public read-only access" ON option_items FOR SELECT USING (true);
CREATE POLICY "Allow admin full access" ON option_items FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
