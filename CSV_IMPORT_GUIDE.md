# CSVインポートガイド

## 📋 スポット情報CSV入力ガイド

### ファイル構成
- `spots_template.csv` - サンプルデータ付きテンプレート
- `spots_empty_template.csv` - 空のテンプレート

### 📝 各項目の説明

#### 必須項目
- **name**: スポット名（必須）
- **address**: 住所（必須）

#### 基本情報
- **latitude**: 緯度（例: 35.7325）
- **longitude**: 経度（例: 139.6064）
- **description**: おすすめコメント
- **visit_duration**: 滞在時間（分、デフォルト60）

#### カテゴリ・分類
- **category**: カテゴリ（例: 公園・自然、文化施設、ショッピング）
- **tags**: タグ（カンマ区切り、例: "桜,散歩,ピクニック"）
- **price_range**: 料金帯（無料、安価、普通、高価）
- **crowd_level**: 混雑度（少ない、普通、多い）

#### 評価・体験
- **rating**: 評価（0-5の数値、例: 4.5）
- **accessibility**: アクセシビリティ（カンマ区切り、例: "車椅子対応,ベビーカー対応"）
- **best_season**: ベストシーズン（カンマ区切り、例: "春,秋"）
- **weather_dependent**: 天候依存（true/false）

#### 営業時間
- **opening_hours**: 営業時間（JSON形式、例: "月曜日: 9:00-20:00,火曜日: 9:00-20:00"）

### 🔧 入力例

```csv
name,address,latitude,longitude,description,visit_duration,category,tags,price_range,crowd_level,rating,accessibility,best_season,weather_dependent,opening_hours
練馬区立石神井公園,東京都練馬区石神井町3-1,35.7325,139.6064,桜の名所として知られる公園。,90,公園・自然,"桜,散歩,ピクニック",無料,普通,4.5,"車椅子対応,ベビーカー対応","春,秋",false,"月曜日: 24時間,火曜日: 24時間"
```

### ⚠️ 注意事項

1. **文字エンコーディング**: UTF-8で保存してください
2. **カンマ区切り**: タグやアクセシビリティはカンマ区切りで入力
3. **引用符**: カンマを含む文字列は引用符で囲む
4. **数値**: 緯度・経度・評価は数値で入力
5. **真偽値**: weather_dependentはtrue/falseで入力

### 🚀 次のステップ

1. CSVファイルを編集
2. バックエンドにCSVインポート機能を追加
3. 一括登録機能を実装

### 📊 カテゴリ例
- 公園・自然
- 文化施設
- ショッピング
- 飲食
- 観光名所
- スポーツ施設
- 教育施設
