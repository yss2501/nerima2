# FastAPI Backend

このプロジェクトはFastAPIを使用したバックエンドAPIです。

## セットアップ

### 1. 仮想環境の作成とアクティベート
```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
```

### 2. 依存関係のインストール
```bash
pip install -r requirements.txt
```

### 3. サーバーの起動
```bash
python main.py
```

または

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API エンドポイント

- `GET /`: ルートエンドポイント
- `GET /api/health`: ヘルスチェック
- `GET /docs`: Swagger UI (自動生成)

## 開発

サーバーは `http://localhost:8000` で起動します。

APIドキュメントは `http://localhost:8000/docs` で確認できます。
