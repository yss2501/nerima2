from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import csv
import io
import aiohttp
import asyncio
import urllib.parse
import unicodedata
import re
import math
from datetime import datetime
import codecs

# データベース関連のインポート
from database import get_db, Spot, CSVUpload, init_db
from models import SpotBase, SpotCreate, SpotUpdate, SpotResponse

# 距離計算関数（ハヴァサイン公式）
def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """2点間の距離を計算（km）"""
    R = 6371  # 地球の半径（km）
    
    # 度をラジアンに変換
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # 緯度と経度の差
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    # ハヴァサイン公式
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

# 移動時間計算関数
def calculate_travel_time(distance_km: float, transport_mode: str) -> int:
    """移動時間を計算（分）"""
    if transport_mode == "walking":
        # 徒歩: 4km/h
        return int(distance_km * 60 / 4)
    elif transport_mode == "cycling":
        # 自転車: 15km/h
        return int(distance_km * 60 / 15)
    elif transport_mode == "driving":
        # 車: 30km/h（市街地）
        return int(distance_km * 60 / 30)
    else:
        # デフォルト: 徒歩
        return int(distance_km * 60 / 4)

# CORS設定（本番環境対応）
import os
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://192.168.1.47:3000",
    "http://192.168.1.47:3001",
    "https://nerima2-1.onrender.com",
]

# 本番環境のフロントエンドURLを環境変数から取得
if os.getenv("FRONTEND_URL"):
    ALLOWED_ORIGINS.append(os.getenv("FRONTEND_URL"))

# Render.comのドメインパターンを追加
ALLOWED_ORIGINS.extend([
    "https://nerima2.onrender.com",
    "https://nerima-wonderland-frontend.onrender.com",
    "https://nerima-wonderland.onrender.com",
])

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 起動時
    init_db()
    print("練馬ワンダーランド API が起動しました")
    yield
    # シャットダウン時（必要に応じて）

app = FastAPI(title="練馬ワンダーランド API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nerima2-1.onrender.com",
        "https://nerima2.onrender.com",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
    ],
)

# Pydanticモデルはmodels.pyからインポート

# 住所正規化関数
def normalize_address(address: str) -> str:
    """住所の全角文字を半角に変換し、特殊文字を置換"""
    if not address:
        return ""
    
    # 全角数字を半角に変換
    address = unicodedata.normalize('NFKC', address)
    
    # 全角文字を半角に変換
    address = address.translate(str.maketrans(
        '０１２３４５６７８９－',
        '0123456789-'
    ))
    
    # 特殊文字の置換
    replacements = {
        '？': '-',
        '?': '-',
        '　': ' ',  # 全角スペースを半角に
        'ー': '-',  # 全角ハイフンを半角に
        '－': '-',  # 全角ハイフンを半角に
        '〜': '-',  # 全角チルダを半角ハイフンに
        '～': '-',  # 全角チルダを半角ハイフンに
        '（': '(',  # 全角括弧を半角に
        '）': ')',
        '【': '[',
        '】': ']',
        '「': '"',
        '」': '"',
        '『': '"',
        '』': '"',
        '、': ',',
        '。': '.',
        '・': ' ',
    }
    
    for old, new in replacements.items():
        address = address.replace(old, new)
    
    # 連続するスペースを1つに
    address = re.sub(r'\s+', ' ', address)
    
    # 先頭と末尾の空白を削除
    address = address.strip()
    
    return address

# 住所パターンマッチング関数
def create_address_variations(address: str) -> List[str]:
    """住所のバリエーションを作成"""
    variations = []
    
    # 元の住所
    variations.append(address)
    
    # 東京都を省略
    if address.startswith('東京都'):
        variations.append(address.replace('東京都', '').strip())
    
    # 練馬区を省略（練馬区の住所の場合）
    if '練馬区' in address:
        variations.append(address.replace('練馬区', '').strip())
    
    # 丁目を削除
    if '丁目' in address:
        variations.append(re.sub(r'\d+丁目', '', address))
    
    # 番地を段階的に削除
    if re.search(r'\d+-\d+-\d+', address):
        variations.append(re.sub(r'(\d+-\d+)-\d+', r'\1', address))
        variations.append(re.sub(r'\d+-\d+-\d+', '', address))
    
    if re.search(r'\d+-\d+', address):
        variations.append(re.sub(r'(\d+)-\d+', r'\1', address))
        variations.append(re.sub(r'\d+-\d+', '', address))
    
    # 建物名や部屋番号を削除
    building_patterns = [
        r'\s+[A-Za-z0-9]+マンション.*',
        r'\s+[A-Za-z0-9]+ビル.*',
        r'\s+[A-Za-z0-9]+タワー.*',
        r'\s+[A-Za-z0-9]+プラザ.*',
        r'\s+[A-Za-z0-9]+センター.*',
        r'\s+[A-Za-z0-9]+ホール.*',
        r'\s+[A-Za-z0-9]+内.*',
        r'\s+[A-Za-z0-9]+F.*',
        r'\s+[A-Za-z0-9]+階.*',
        r'\s+[A-Za-z0-9]+号.*',
        r'\s+[A-Za-z0-9]+室.*',
        r'\s+[A-Za-z0-9]+公園内.*',
    ]
    
    for pattern in building_patterns:
        if re.search(pattern, address):
            variations.append(re.sub(pattern, '', address))
    
    # 重複を削除し、空文字列を除外
    variations = list(dict.fromkeys(variations))
    variations = [addr.strip() for addr in variations if addr.strip()]
    
    return variations

# 住所簡略化関数
def simplify_address(address: str) -> List[str]:
    """住所を段階的に簡略化してリストで返す"""
    simplified = []
    
    # 元の住所
    simplified.append(address)
    
    # 建物名や部屋番号を削除（例：江古田マンション 1F、練馬区役所内２０Ｆ）
    building_patterns = [
        r'\s+[A-Za-z0-9]+マンション.*',
        r'\s+[A-Za-z0-9]+ビル.*',
        r'\s+[A-Za-z0-9]+タワー.*',
        r'\s+[A-Za-z0-9]+プラザ.*',
        r'\s+[A-Za-z0-9]+センター.*',
        r'\s+[A-Za-z0-9]+ホール.*',
        r'\s+[A-Za-z0-9]+内.*',
        r'\s+[A-Za-z0-9]+F.*',
        r'\s+[A-Za-z0-9]+階.*',
        r'\s+[A-Za-z0-9]+号.*',
        r'\s+[A-Za-z0-9]+室.*',
    ]
    
    for pattern in building_patterns:
        if re.search(pattern, address):
            simplified.append(re.sub(pattern, '', address))
    
    # 番地を削除（例：1-2-3 → 1-2）
    if re.search(r'\d+-\d+-\d+', address):
        simplified.append(re.sub(r'(\d+-\d+)-\d+', r'\1', address))
    
    # 番地をさらに削除（例：1-2 → 1）
    if re.search(r'\d+-\d+', address):
        simplified.append(re.sub(r'(\d+)-\d+', r'\1', address))
    
    # 丁目を削除
    if '丁目' in address:
        simplified.append(re.sub(r'\d+丁目', '', address))
    
    # 番地を完全に削除
    if re.search(r'\d+', address):
        simplified.append(re.sub(r'\d+', '', address))
    
    # 町名を削除（最後の手段）
    if re.search(r'[町村]', address):
        simplified.append(re.sub(r'[町村][^区市]*', '', address))
    
    # 重複を削除し、空文字列を除外
    simplified = list(dict.fromkeys(simplified))  # 重複削除（順序保持）
    simplified = [addr.strip() for addr in simplified if addr.strip()]
    
    return simplified

# 練馬区の主要な場所の座標データベース
NERIMA_LOCATIONS = {
    # 光が丘エリア
    "光が丘": (35.7589, 139.6286),
    "光が丘4丁目": (35.7589, 139.6286),
    "光が丘4": (35.7589, 139.6286),
    
    # 石神井エリア
    "石神井台": (35.7434, 139.6064),
    "石神井台1丁目": (35.7434, 139.6064),
    "石神井台1": (35.7434, 139.6064),
    
    # 旭丘エリア
    "旭丘": (35.7375, 139.6547),
    "旭丘1丁目": (35.7375, 139.6547),
    "旭丘1": (35.7375, 139.6547),
    
    # 豊玉エリア
    "豊玉北": (35.7375, 139.6547),
    "豊玉北6": (35.7375, 139.6547),
    
    # 桜台エリア
    "桜台": (35.7375, 139.6547),
    "桜台4丁目": (35.7375, 139.6547),
    "桜台4": (35.7375, 139.6547),
    
    # 向山エリア
    "向山": (35.7375, 139.6547),
    "向山3丁目": (35.7375, 139.6547),
    "向山3": (35.7375, 139.6547),
    
    # 練馬区役所
    "練馬区役所": (35.7375, 139.6547),
    
    # 豊島区（隣接区）
    "豊島区南長崎": (35.7200, 139.6800),
    "南長崎": (35.7200, 139.6800),
}

# 住所の手動補完機能
def get_coordinates_from_database(address: str) -> tuple[Optional[float], Optional[float]]:
    """事前定義された座標データベースから座標を取得"""
    normalized_address = normalize_address(address)
    
    # 完全一致を試行
    if normalized_address in NERIMA_LOCATIONS:
        lat, lon = NERIMA_LOCATIONS[normalized_address]
        print(f"✅ データベースから住所 '{normalized_address}' の座標を取得: ({lat}, {lon})")
        return lat, lon
    
    # 部分一致を試行
    for key, (lat, lon) in NERIMA_LOCATIONS.items():
        if key in normalized_address:
            print(f"✅ データベースから住所 '{normalized_address}' の座標を取得（部分一致: {key}）: ({lat}, {lon})")
            return lat, lon
    
    return None, None

# Nominatim を使用した座標取得
async def get_coordinates_from_nominatim(address: str) -> tuple[Optional[float], Optional[float]]:
    """Nominatim を使用して住所から座標を取得"""
    try:
        async with aiohttp.ClientSession() as session:
            encoded_address = urllib.parse.quote(address)
            url = f"https://nominatim.openstreetmap.org/search?q={encoded_address}&format=json&limit=1&countrycodes=jp"
            
            headers = {
                'User-Agent': 'NerimaWonderland/1.0'
            }
            
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if data and len(data) > 0:
                        lat = float(data[0]['lat'])
                        lon = float(data[0]['lon'])
                        return lat, lon
                        
    except Exception as e:
        print(f"Nominatim エラー: {str(e)}")
    
    return None, None

# Google Maps Geocoding API を使用した座標取得（APIキーが必要）
async def get_coordinates_from_google_maps(address: str) -> tuple[Optional[float], Optional[float]]:
    """Google Maps Geocoding API を使用して住所から座標を取得"""
    try:
        # Google Maps API キーが設定されている場合のみ使用
        api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        if not api_key:
            print("Google Maps API キーが設定されていません")
            return None, None
            
        async with aiohttp.ClientSession() as session:
            encoded_address = urllib.parse.quote(address)
            url = f"https://maps.googleapis.com/maps/api/geocode/json?address={encoded_address}&key={api_key}&language=ja&region=jp"
            
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('status') == 'OK' and data.get('results'):
                        location = data['results'][0]['geometry']['location']
                        lat = float(location['lat'])
                        lon = float(location['lng'])
                        return lat, lon
                        
    except Exception as e:
        print(f"Google Maps エラー: {str(e)}")
    
    return None, None

# 住所から座標を取得
async def get_coordinates_from_address(address: str) -> tuple[Optional[float], Optional[float]]:
    """住所から緯度経度を取得（複数のサービスを使用）"""
    try:
        # 住所を正規化
        normalized_address = normalize_address(address)
        print(f"正規化前: '{address}'")
        print(f"正規化後: '{normalized_address}'")
        
        # 1. まずデータベース検索を試行
        print(f"\n=== データベース検索を試行 ===")
        lat, lon = get_coordinates_from_database(normalized_address)
        if lat is not None and lon is not None:
            return lat, lon
        
        # 2. 住所のバリエーションを作成
        address_variations = create_address_variations(normalized_address)
        print(f"試行する住所パターン: {address_variations}")
        
        # 3. 複数のジオコーディングサービスを試行
        services = [
            ("Nominatim", get_coordinates_from_nominatim),
            ("Google Maps", get_coordinates_from_google_maps),
        ]
        
        for service_name, service_func in services:
            print(f"\n=== {service_name} で座標取得を試行 ===")
            for i, addr in enumerate(address_variations):
                if not addr.strip():
                    continue
                
                lat, lon = await service_func(addr)
                if lat is not None and lon is not None:
                    print(f"✅ {service_name} で住所 '{addr}' の座標を取得: ({lat}, {lon})")
                    return lat, lon
                else:
                    print(f"❌ {service_name} で住所 '{addr}' の座標が見つかりませんでした")
        
        print(f"❌ 全てのサービスで住所 '{address}' の座標を取得できませんでした")
        return None, None
        
    except Exception as e:
        print(f"❌ 住所 '{address}' の座標取得でエラー: {str(e)}")
        return None, None

# APIエンドポイント
@app.get("/")
async def root():
    return {"message": "練馬ワンダーランド API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# CORSプリフライトリクエスト用のエンドポイント
@app.options("/{path:path}")
async def options_handler(path: str):
    return {"message": "OK"}

# スポット関連のエンドポイント
@app.get("/api/plans")
async def get_plans(db: Session = Depends(get_db)):
    """登録されているプランの一覧を取得"""
    plans = db.query(Spot.plan).filter(Spot.plan.isnot(None), Spot.plan != "").distinct().all()
    plan_list = [plan[0] for plan in plans if plan[0]]
    return {"plans": plan_list}

@app.get("/api/spots", response_model=List[SpotResponse])
async def get_spots(db: Session = Depends(get_db)):
    """全スポットを取得"""
    spots = db.query(Spot).all()
    # 手動でレスポンスを構築
    return [
        SpotResponse(
            id=spot.id,
            name=spot.name,
            address=spot.address,
            latitude=spot.latitude,
            longitude=spot.longitude,
            description=spot.description,
            plan=spot.plan,
            image_url=spot.image_url,
            visit_duration=spot.visit_duration,
            created_at=spot.created_at,
            updated_at=spot.updated_at
        ) for spot in spots
    ]

@app.get("/api/spots/{spot_id}", response_model=SpotResponse)
async def get_spot(spot_id: int, db: Session = Depends(get_db)):
    """特定のスポットを取得"""
    spot = db.query(Spot).filter(Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="スポットが見つかりません")
    return spot

@app.post("/api/spots", response_model=SpotResponse)
async def create_spot(spot: SpotCreate, db: Session = Depends(get_db)):
    """新しいスポットを作成"""
    db_spot = Spot(**spot.model_dump())
    db.add(db_spot)
    db.commit()
    db.refresh(db_spot)
    return db_spot

@app.put("/api/spots/{spot_id}", response_model=SpotResponse)
async def update_spot(spot_id: int, spot: SpotUpdate, db: Session = Depends(get_db)):
    """スポットを更新"""
    db_spot = db.query(Spot).filter(Spot.id == spot_id).first()
    if not db_spot:
        raise HTTPException(status_code=404, detail="スポットが見つかりません")
    
    update_data = spot.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_spot, field, value)
    
    db.commit()
    db.refresh(db_spot)
    return db_spot

@app.put("/api/spots/{spot_id}")
async def update_spot(spot_id: int, spot_update: SpotUpdate, db: Session = Depends(get_db)):
    """スポット情報を更新"""
    spot = db.query(Spot).filter(Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="スポットが見つかりません")
    
    # 更新可能なフィールドを更新
    update_data = spot_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(spot, field, value)
    
    spot.updated_at = datetime.now()
    db.commit()
    db.refresh(spot)
    
    return spot

@app.delete("/api/spots/{spot_id}")
async def delete_spot(spot_id: int, db: Session = Depends(get_db)):
    """スポットを削除"""
    db_spot = db.query(Spot).filter(Spot.id == spot_id).first()
    if not db_spot:
        raise HTTPException(status_code=404, detail="スポットが見つかりません")
    
    db.delete(db_spot)
    db.commit()
    return {"message": "スポットが削除されました"}

# CSVアップロードエンドポイント
@app.post("/api/upload/csv")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """CSVファイルをアップロードしてスポットデータをインポート"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="CSVファイルをアップロードしてください")
    
    try:
        # CSVファイルを読み込み（文字エンコーディングを自動検出）
        content = await file.read()
        
        # 文字エンコーディングを自動検出（標準ライブラリを使用）
        # 一般的な日本語エンコーディングを順番に試行
        encodings = ['utf-8', 'shift_jis', 'cp932', 'euc-jp', 'iso-2022-jp']
        csv_content = None
        detected_encoding = 'utf-8'
        
        print(f"エンコーディング検出を開始...")
        
        for encoding in encodings:
            if encoding is None:
                continue
            try:
                csv_content = content.decode(encoding)
                print(f"CSVファイルを {encoding} エンコーディングで読み込みました")
                break
            except (UnicodeDecodeError, LookupError):
                continue
        
        if csv_content is None:
            raise HTTPException(status_code=400, detail="CSVファイルの文字エンコーディングを判別できませんでした")
        
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        created_spots = []
        errors = []
        skipped_duplicates = []
        
        # CSVアップロード履歴を記録
        csv_upload = CSVUpload(
            filename=file.filename,
            spot_count=0
        )
        db.add(csv_upload)
        db.flush()  # IDを取得するためにflush
        
        for row_num, row in enumerate(csv_reader, start=2):  # ヘッダー行を除く
            try:
                # 必須フィールドのチェック
                if not row.get('name') or not row.get('address'):
                    errors.append(f"行 {row_num}: 名前と住所は必須です")
                    continue
                
                # 重複チェック（同じ名前のスポットが既に存在するかチェック）
                existing_spot = db.query(Spot).filter(Spot.name == row['name']).first()
                if existing_spot:
                    skipped_duplicates.append({
                        'row': row_num,
                        'name': row['name'],
                        'address': row['address'],
                        'existing_id': existing_spot.id,
                        'existing_address': existing_spot.address
                    })
                    continue
                
                # 座標が未設定の場合は住所から取得
                latitude = row.get('latitude')
                longitude = row.get('longitude')
                
                if not latitude or not longitude:
                    lat, lon = await get_coordinates_from_address(row['address'])
                    if lat and lon:
                        latitude = lat
                        longitude = lon
                    else:
                        errors.append(f"行 {row_num}: 住所 '{row['address']}' の座標が見つかりませんでした")
                        continue
                
                # プラン名の処理（新規プランの場合はそのまま使用）
                plan_name = row.get('plan', '').strip()
                
                # スポットを作成
                spot_data = {
                    'name': row['name'],
                    'address': row['address'],
                    'latitude': float(latitude) if latitude else None,
                    'longitude': float(longitude) if longitude else None,
                    'description': row.get('description', ''),
                    'plan': plan_name,
                    'image_url': row.get('image_url', ''),
                    'visit_duration': int(row['visit_duration']) if row.get('visit_duration') else None
                }
                
                db_spot = Spot(**spot_data)
                db.add(db_spot)
                db.flush()  # IDを取得
                
                created_spots.append({
                    'id': db_spot.id,
                    'name': db_spot.name,
                    'address': db_spot.address,
                    'latitude': db_spot.latitude,
                    'longitude': db_spot.longitude,
                    'description': db_spot.description,
                    'plan': db_spot.plan,
                    'image_url': db_spot.image_url,
                    'visit_duration': db_spot.visit_duration
                })
                
            except Exception as e:
                errors.append(f"行 {row_num}: {str(e)}")
        
        # CSVアップロード履歴を更新
        csv_upload.spot_count = len(created_spots)
        csv_upload.success = len(errors) == 0
        
        # 新規追加されたプラン名を取得
        new_plans = []
        if created_spots:
            for spot in created_spots:
                if spot.get('plan') and spot['plan'] not in new_plans:
                    new_plans.append(spot['plan'])
        
        db.commit()
        
        return {
            "message": f"CSVファイルが正常にアップロードされました",
            "created_spots": created_spots,
            "total_spots": len(created_spots),
            "skipped_duplicates": skipped_duplicates,
            "duplicate_count": len(skipped_duplicates),
            "new_plans": new_plans,
            "new_plan_count": len(new_plans),
            "errors": errors,
            "error_count": len(errors)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"CSVファイルの処理中にエラーが発生しました: {str(e)}")

# 気分別スポット取得エンドポイント

# ルート生成エンドポイント（GET版）
@app.get("/api/route")
async def generate_route(
    start_lat: float = Query(...),
    start_lng: float = Query(...),
    spot_ids: str = Query(...),
    transport_mode: str = Query("walking"),
    return_to_start: bool = Query(True),
    db: Session = Depends(get_db)
):
    """スポットからルートを生成"""
    try:
        print(f"DEBUG: Received request - start_lat={start_lat}, start_lng={start_lng}, spot_ids={spot_ids}")
        
        # スポットIDを解析
        spot_id_list = [int(id) for id in spot_ids.split(',')]
        print(f"DEBUG: Parsed spot IDs: {spot_id_list}")
        
        # スポットを取得
        db_spots = db.query(Spot).filter(Spot.id.in_(spot_id_list)).all()
        print(f"DEBUG: Found {len(db_spots)} spots in database")
        
        if not db_spots:
            raise HTTPException(status_code=404, detail="指定されたスポットが見つかりません")
        
        # 座標が未設定のスポットがある場合は住所から取得
        for spot in db_spots:
            if not spot.latitude or not spot.longitude:
                lat, lon = await get_coordinates_from_address(spot.address)
                if lat and lon:
                    spot.latitude = lat
                    spot.longitude = lon
                    db.commit()
                else:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"スポット '{spot.name}' の座標を取得できませんでした"
                    )
        
        # ルート計算（距離・時間計算付き）
        route_points = []
        total_distance = 0
        total_travel_time = 0
        
        print(f"DEBUG: ルート生成開始 - スポット数: {len(db_spots)}, 出発地: ({start_lat}, {start_lng})")
        
        # 出発地から最初のスポット
        if db_spots:
            first_spot = db_spots[0]
            distance = calculate_distance(start_lat, start_lng, first_spot.latitude, first_spot.longitude)
            travel_time = calculate_travel_time(distance, transport_mode)
            
            print(f"DEBUG: 出発地から最初のスポット({first_spot.name})への距離: {distance:.2f}km, 時間: {travel_time}分")
            
            route_points.append({
                "id": "start",
                "name": "出発地",
                "address": "出発地",
                "latitude": start_lat,
                "longitude": start_lng,
                "description": "出発地",
                "plan": None,
                "visit_duration": 0,
                "distance_from_previous": 0,
                "travel_time_from_previous": 0
            })
            
            route_points.append({
                "id": first_spot.id,
                "name": first_spot.name,
                "address": first_spot.address,
                "latitude": first_spot.latitude,
                "longitude": first_spot.longitude,
                "description": first_spot.description,
                "plan": first_spot.plan,
                "visit_duration": first_spot.visit_duration or 0,
                "distance_from_previous": distance,
                "travel_time_from_previous": travel_time
            })
            
            total_distance += distance
            total_travel_time += travel_time
            
            # スポット間の移動
            for i in range(1, len(db_spots)):
                prev_spot = db_spots[i-1]
                current_spot = db_spots[i]
                
                distance = calculate_distance(
                    prev_spot.latitude, prev_spot.longitude,
                    current_spot.latitude, current_spot.longitude
                )
                travel_time = calculate_travel_time(distance, transport_mode)
                
                print(f"DEBUG: {prev_spot.name}から{current_spot.name}への距離: {distance:.2f}km, 時間: {travel_time}分")
                
                route_points.append({
                    "id": current_spot.id,
                    "name": current_spot.name,
                    "address": current_spot.address,
                    "latitude": current_spot.latitude,
                    "longitude": current_spot.longitude,
                    "description": current_spot.description,
                    "plan": current_spot.plan,
                    "visit_duration": current_spot.visit_duration or 0,
                    "distance_from_previous": distance,
                    "travel_time_from_previous": travel_time
                })
                
                total_distance += distance
                total_travel_time += travel_time
            
            # 最後のスポットから出発地に戻る
            if return_to_start:
                last_spot = db_spots[-1]
                distance = calculate_distance(
                    last_spot.latitude, last_spot.longitude,
                    start_lat, start_lng
                )
                travel_time = calculate_travel_time(distance, transport_mode)
                
                print(f"DEBUG: 最後のスポット({last_spot.name})から出発地への距離: {distance:.2f}km, 時間: {travel_time}分")
                
                route_points.append({
                    "id": "return",
                    "name": "出発地に戻る",
                    "address": "出発地",
                    "latitude": start_lat,
                    "longitude": start_lng,
                    "description": "出発地に戻りました",
                    "plan": None,
                    "visit_duration": 0,
                    "distance_from_previous": distance,
                    "travel_time_from_previous": travel_time
                })
                
                total_distance += distance
                total_travel_time += travel_time
        
        # 総滞在時間を計算
        total_visit_time = sum(spot.get("visit_duration", 0) for spot in route_points)
        
        print(f"DEBUG: ルート生成完了 - 総距離: {total_distance:.2f}km, 総移動時間: {total_travel_time}分, 総滞在時間: {total_visit_time}分")
        print(f"DEBUG: ルートポイント数: {len(route_points)}")
        
        return {
            "message": "ルートが生成されました",
            "route_points": route_points,
            "total_points": len(route_points),
            "transport_mode": transport_mode,
            "return_to_start": return_to_start,
            "total_distance": round(total_distance, 2),
            "total_travel_time": total_travel_time,
            "total_visit_time": total_visit_time,
            "total_duration": total_travel_time + total_visit_time
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ルート生成中にエラーが発生しました: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
