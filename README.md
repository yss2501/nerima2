# 練馬ワンダーランド - Tourism Route Generator

練馬区特化の観光ルート生成サービスです。

## 機能

- 🗺️ 実際の道路に沿ったルート生成
- 🚶‍♂️ 徒歩、自転車、車での移動手段選択
- 📍 現在地、住所入力、地図クリックでの出発地設定
- 🏛️ 観光スポットの管理（CRUD）
- 🖼️ スポット画像のアップロード・表示
- ⚙️ 動的オプションリスト管理

## 技術スタック

### バックエンド
- **FastAPI** - Python Webフレームワーク
- **Supabase** - PostgreSQLデータベース
- **Google Maps Directions API** - ルート生成
- **OpenStreetMap Nominatim** - 住所から座標変換

### フロントエンド
- **Next.js** - Reactフレームワーク
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - スタイリング
- **Leaflet** - 地図表示

## セットアップ

### バックエンド

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

### 環境変数

`.env`ファイルを作成：

```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## デプロイ

### Render

1. GitHubにコードをプッシュ
2. [Render Dashboard](https://dashboard.render.com/)でサービスを作成
3. GitHubリポジトリを接続
4. 環境変数を設定
5. デプロイ実行

## ライセンス

MIT License
