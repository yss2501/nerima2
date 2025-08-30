from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List, Optional
import logging
import os
import uuid
import shutil
from pathlib import Path
from config import get_supabase_client
from models import SpotCreate, SpotUpdate, Spot
from services import spot_service
from option_models import (
    OptionCategory, OptionCategoryCreate, OptionCategoryUpdate,
    OptionItem, OptionItemCreate, OptionItemUpdate,
    OptionCategoryWithItems
)
from option_service import option_service

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Tourism Route Generator API",
    description="観光コース自動生成サービスのバックエンドAPI",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.jsのポート
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 画像保存用ディレクトリを作成
UPLOAD_DIR = Path("uploads/images")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# 静的ファイルマウント（画像配信用）
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {"message": "Tourism Route Generator API is running!"}

# アプリケーション起動時の初期化
@app.on_event("startup")
async def startup_event():
    """アプリケーション起動時の初期化処理"""
    try:
        await option_service.initialize_default_options()
        logger.info("Default options initialized successfully")
    except Exception as e:
        logger.error(f"Error during startup initialization: {e}")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Backend is running"}

# 観光スポット関連のAPIエンドポイント

@app.get("/api/spots", response_model=List[Spot])
async def get_spots(
    limit: int = Query(100, ge=1, le=1000, description="取得件数"),
    offset: int = Query(0, ge=0, description="オフセット")
):
    """観光スポット一覧を取得"""
    try:
        spots = await spot_service.get_all_spots(limit=limit, offset=offset)
        return spots
    except Exception as e:
        logger.error(f"Error in get_spots: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/spots/{spot_id}", response_model=Spot)
async def get_spot(spot_id: str):
    """特定の観光スポットを取得"""
    try:
        spot = await spot_service.get_spot_by_id(spot_id)
        if not spot:
            raise HTTPException(status_code=404, detail="Spot not found")
        return spot
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_spot: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/spots", response_model=Spot)
async def create_spot(spot_data: SpotCreate):
    """新しい観光スポットを作成"""
    try:
        spot = await spot_service.create_spot(spot_data)
        return spot
    except Exception as e:
        logger.error(f"Error in create_spot: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.put("/api/spots/{spot_id}", response_model=Spot)
async def update_spot(spot_id: str, spot_data: SpotUpdate):
    """観光スポットを更新"""
    try:
        spot = await spot_service.update_spot(spot_id, spot_data)
        if not spot:
            raise HTTPException(status_code=404, detail="Spot not found")
        return spot
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in update_spot: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/api/spots/{spot_id}")
async def delete_spot(spot_id: str):
    """観光スポットを削除（論理削除）"""
    try:
        success = await spot_service.delete_spot(spot_id)
        if not success:
            raise HTTPException(status_code=404, detail="Spot not found")
        return {"message": "Spot deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_spot: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/spots/search", response_model=List[Spot])
async def search_spots(
    category: Optional[str] = Query(None, description="カテゴリで検索"),
    tags: Optional[str] = Query(None, description="タグで検索（カンマ区切り）"),
    price_range: Optional[str] = Query(None, description="料金帯で検索"),
    crowd_level: Optional[str] = Query(None, description="混雑度で検索")
):
    """条件に基づいて観光スポットを検索"""
    try:
        # タグ文字列をリストに変換
        tag_list = None
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
        
        spots = await spot_service.search_spots(
            category=category,
            tags=tag_list,
            price_range=price_range,
            crowd_level=crowd_level
        )
        return spots
    except Exception as e:
        logger.error(f"Error in search_spots: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/route")
async def calculate_route(
    start_lat: float = Query(..., description="出発地の緯度"),
    start_lng: float = Query(..., description="出発地の経度"),
    spot_ids: str = Query(..., description="訪問スポットのID（カンマ区切り）"),
    transport_mode: str = Query("walking", description="移動手段（walking, cycling, driving）"),
    return_to_start: bool = Query(True, description="出発地に戻るかどうか"),
    use_fallback: bool = Query(False, description="強制的にフォールバック計算を使用")
):
    """観光コースのルートを計算"""
    try:
        # スポットIDをリストに変換
        spot_id_list = [id.strip() for id in spot_ids.split(",") if id.strip()]
        
        # スポット情報を取得
        spots = []
        for spot_id in spot_id_list:
            spot = await spot_service.get_spot_by_id(spot_id)
            if spot:
                spots.append(spot)
        
        if not spots:
            raise HTTPException(status_code=404, detail="指定されたスポットが見つかりません")
        
        # ルート計算（フォールバック強制またはOSRM APIを使用）
        # OSRM APIが不安定なため、暫定的にフォールバック計算を使用
        if use_fallback or True:  # 暫定的に常にフォールバック使用
            logging.info("Using fallback calculation (OSRM API unstable)")
            route_info = await calculate_route_info_fallback(start_lat, start_lng, spots, transport_mode, return_to_start)
        else:
            route_info = await calculate_route_info(start_lat, start_lng, spots, transport_mode, return_to_start)
        
        return {
            "success": True,
            "data": route_info
        }
    except Exception as e:
        logging.error(f"ルート計算エラー: {e}")
        raise HTTPException(status_code=500, detail="ルート計算に失敗しました")

async def calculate_route_info(start_lat: float, start_lng: float, spots: list, transport_mode: str, return_to_start: bool):
    """ルート情報を計算（OSRM APIを使用）"""
    import aiohttp
    import asyncio
    
    # OSRM APIのプロファイルマッピング
    osrm_profiles = {
        "walking": "foot",
        "cycling": "bike", 
        "driving": "car"
    }
    profile = osrm_profiles.get(transport_mode, "foot")
    logging.info(f"Transport mode '{transport_mode}' mapped to OSRM profile '{profile}'")
    total_distance = 0
    total_time = 0
    route_points = []
    detailed_route = []  # 詳細なルートポイント
    
    # 出発地をルートポイントに追加
    route_points.append({
        "lat": start_lat,
        "lng": start_lng,
        "name": "出発地",
        "distance_from_previous": 0,
        "travel_time": 0,
        "visit_duration": 0
    })
    
    # 出発地から最初のスポット
    current_lat, current_lng = start_lat, start_lng
    
    # 全ての座標を収集してOSRM APIで一括計算
    coordinates = []
    coordinates.append(f"{start_lng},{start_lat}")  # OSRMは lng,lat の順序
    
    for spot in spots:
        if spot.latitude and spot.longitude:
            coordinates.append(f"{float(spot.longitude)},{float(spot.latitude)}")
    
    if return_to_start and spots:
        coordinates.append(f"{start_lng},{start_lat}")
    
    try:
        # OSRM APIでルート計算
        route_data = await get_osrm_route(coordinates, profile)
        logging.info(f"OSRM API Response for profile {profile}: {route_data}")
        
        if route_data and route_data.get('routes') and len(route_data['routes']) > 0:
            route = route_data['routes'][0]
            total_distance = route['distance'] / 1000  # メートルをキロメートルに変換
            total_time = route['duration'] / 60  # 秒を分に変換
            
            logging.info(f"OSRM Route: distance={total_distance}km, time={total_time}min")
            
            # 移動時間が妥当かチェック（13.95kmで20分は明らかにおかしい）
            if total_distance > 0 and total_time > 0:
                speed_check = (total_distance / (total_time / 60))  # km/h
                logging.info(f"OSRM calculated speed: {speed_check:.1f} km/h for {transport_mode} (profile: {profile})")
                
                # 徒歩で15km/h以上、自転車で50km/h以上、車で100km/h以上は異常
                max_speeds = {"foot": 15, "bike": 50, "car": 100}
                min_speeds = {"foot": 2, "bike": 8, "car": 20}  # 最低速度もチェック
                
                if (speed_check > max_speeds.get(profile, 100) or 
                    speed_check < min_speeds.get(profile, 1)):
                    logging.warning(f"OSRM speed {speed_check:.1f} km/h is unrealistic for {profile}. Using fallback.")
                    return await calculate_route_info_fallback(start_lat, start_lng, spots, transport_mode, return_to_start)
                else:
                    logging.info(f"OSRM speed {speed_check:.1f} km/h is acceptable for {profile}. Using OSRM result.")
            
            # 詳細なルートジオメトリを取得
            if 'geometry' in route:
                detailed_route = decode_polyline(route['geometry'])
            
            # 各区間の詳細情報を計算
            legs = route.get('legs', [])
            logging.info(f"Route legs: {len(legs)}")
            
            # 出発地から各スポットへの区間情報
            for i, spot in enumerate(spots):
                if i < len(legs):
                    leg = legs[i]
                    route_points.append({
                        "lat": float(spot.latitude),
                        "lng": float(spot.longitude),
                        "name": spot.name,
                        "distance_from_previous": leg['distance'] / 1000,  # km
                        "travel_time": int(leg['duration'] / 60),  # 分
                        "visit_duration": spot.visit_duration,
                        "image_id": spot.image_id
                    })
                    logging.info(f"Leg {i}: {spot.name}, distance={leg['distance']/1000:.2f}km, time={leg['duration']/60:.1f}min")
            
            # 出発地に戻る場合
            if return_to_start and spots and len(legs) > len(spots):
                final_leg = legs[-1]
                route_points.append({
                    "lat": start_lat,
                    "lng": start_lng,
                    "name": "出発地（戻り）",
                    "distance_from_previous": final_leg['distance'] / 1000,
                    "travel_time": int(final_leg['duration'] / 60),
                    "visit_duration": 0
                })
                logging.info(f"Return leg: distance={final_leg['distance']/1000:.2f}km, time={final_leg['duration']/60:.1f}min")
        else:
            logging.warning(f"OSRM API returned no routes for profile {profile}. Using fallback.")
            # フォールバック: 直線距離で計算
            return await calculate_route_info_fallback(start_lat, start_lng, spots, transport_mode, return_to_start)
    
    except Exception as e:
        logging.error(f"OSRM API エラー: {e}")
        # フォールバック: 直線距離で計算
        return await calculate_route_info_fallback(start_lat, start_lng, spots, transport_mode, return_to_start)
    
    # 滞在時間を総時間に追加
    visit_time = sum(spot.visit_duration for spot in spots)
    travel_time_only = total_time  # OSRMからの移動時間のみ
    total_time_with_visits = total_time + visit_time  # 移動時間 + 滞在時間
    
    logging.info(f"Final calculation: travel_time={travel_time_only:.1f}min, visit_time={visit_time}min, total_time={total_time_with_visits:.1f}min")
    
    return {
        "total_distance": round(total_distance, 2),
        "total_time": int(total_time_with_visits),
        "transport_mode": transport_mode,
        "route_points": route_points,
        "detailed_route": detailed_route,  # 詳細なルートライン用
        "summary": {
            "total_spots": len(spots),
            "travel_time": int(travel_time_only),
            "visit_time": visit_time,
            "return_to_start": return_to_start
        }
    }

async def get_osrm_route(coordinates: list, profile: str = "foot"):
    """OSRM APIでルート情報を取得"""
    import aiohttp
    import asyncio
    
    # OSRM Demo Server（本番環境では独自サーバーを推奨）
    base_url = f"http://router.project-osrm.org/route/v1/{profile}"
    coordinates_str = ";".join(coordinates)
    
    url = f"{base_url}/{coordinates_str}"
    params = {
        "overview": "full",
        "geometries": "polyline",
        "steps": "false"
    }
    
    logging.info(f"OSRM API Request: {url} with params: {params}")
    
    try:
        timeout = aiohttp.ClientTimeout(total=15)  # 15秒タイムアウト
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    logging.info(f"OSRM API Success: received {len(data.get('routes', []))} routes")
                    return data
                else:
                    error_text = await response.text()
                    logging.error(f"OSRM API Error {response.status}: {error_text}")
                    return None
    except asyncio.TimeoutError:
        logging.error("OSRM API timeout")
        return None
    except Exception as e:
        logging.error(f"OSRM API request failed: {e}")
        return None

def decode_polyline(polyline_str):
    """Polylineをデコードして座標リストに変換"""
    try:
        import polyline
        coordinates = polyline.decode(polyline_str)
        return [{"lat": lat, "lng": lng} for lat, lng in coordinates]
    except ImportError:
        logging.warning("polyline package not installed. Using simplified route.")
        return []
    except Exception as e:
        logging.error(f"Polyline decode error: {e}")
        return []

async def calculate_route_info_fallback(start_lat: float, start_lng: float, spots: list, transport_mode: str, return_to_start: bool):
    """フォールバック: 直線距離での計算（移動手段別速度適用）"""
    logging.info(f"Using fallback calculation for transport_mode: {transport_mode}")
    
    # 移動手段による速度（km/h）
    speeds = {
        "walking": 4.0,   # 徒歩: 4km/h
        "cycling": 15.0,  # 自転車: 15km/h  
        "driving": 40.0   # タクシー: 40km/h（都市部を考慮）
    }
    
    logging.info(f"Available speeds: {speeds}")
    logging.info(f"Requested transport_mode: '{transport_mode}'")
    
    speed = speeds.get(transport_mode, 4.0)
    logging.info(f"Selected speed for {transport_mode}: {speed} km/h")
    
    total_distance = 0
    total_travel_time = 0  # 移動時間のみ
    route_points = []
    
    # 出発地をルートポイントに追加
    route_points.append({
        "lat": start_lat,
        "lng": start_lng,
        "name": "出発地",
        "distance_from_previous": 0,
        "travel_time": 0,
        "visit_duration": 0
    })
    
    current_lat, current_lng = start_lat, start_lng
    
    for i, spot in enumerate(spots):
        if spot.latitude and spot.longitude:
            distance = calculate_distance(
                current_lat, current_lng,
                float(spot.latitude), float(spot.longitude)
            )
            
            # 直線距離を道路距離に補正（直線距離 × 1.3倍）
            road_distance = distance * 1.3
            travel_time = (road_distance / speed) * 60  # 分単位
            
            logging.info(f"Fallback calculation for {spot.name}:")
            logging.info(f"  - Direct distance: {distance:.2f}km")
            logging.info(f"  - Road distance (1.3x): {road_distance:.2f}km") 
            logging.info(f"  - Speed: {speed} km/h ({transport_mode})")
            logging.info(f"  - Travel time: {travel_time:.1f} minutes")
            
            route_points.append({
                "lat": float(spot.latitude),
                "lng": float(spot.longitude),
                                    "name": spot.name,
                    "distance_from_previous": road_distance,
                    "travel_time": int(travel_time),
                    "visit_duration": spot.visit_duration,
                    "image_id": spot.image_id
            })
            
            total_distance += road_distance
            total_travel_time += travel_time
            
            logging.info(f"Spot {i+1} ({spot.name}): distance={road_distance:.2f}km, travel_time={travel_time:.1f}min")
            
            current_lat, current_lng = float(spot.latitude), float(spot.longitude)
    
    if return_to_start and spots:
        final_distance = calculate_distance(current_lat, current_lng, start_lat, start_lng)
        road_final_distance = final_distance * 1.3
        final_travel_time = (road_final_distance / speed) * 60
        
        total_distance += road_final_distance
        total_travel_time += final_travel_time
        
        route_points.append({
            "lat": start_lat,
            "lng": start_lng,
            "name": "出発地（戻り）",
            "distance_from_previous": road_final_distance,
            "travel_time": int(final_travel_time),
            "visit_duration": 0
        })
        
        logging.info(f"Return: distance={road_final_distance:.2f}km, travel_time={final_travel_time:.1f}min")
    
    # 滞在時間の合計
    total_visit_time = sum(spot.visit_duration for spot in spots)
    total_time = total_travel_time + total_visit_time
    
    # 実際の道路に沿ったルートを生成（Google Maps Directions API使用）
    detailed_route = []
    
    # Google Maps APIキーを環境変数から取得
    import os
    import aiohttp
    from dotenv import load_dotenv
    
    # .envファイルを読み込み
    load_dotenv()
    google_maps_api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    
    logging.info(f"Google Maps API key found: {google_maps_api_key is not None}")
    if google_maps_api_key:
        logging.info(f"API key starts with: {google_maps_api_key[:10]}...")
    
    if google_maps_api_key:
        try:
            # Google Maps Directions APIを使用
            for i in range(len(route_points) - 1):
                origin = f"{route_points[i]['lat']},{route_points[i]['lng']}"
                destination = f"{route_points[i+1]['lat']},{route_points[i+1]['lng']}"
                
                # 移動手段に応じたモードを設定
                mode_map = {
                    'walking': 'walking',
                    'cycling': 'bicycling', 
                    'driving': 'driving'
                }
                mode = mode_map.get(transport_mode, 'walking')
                
                url = f"https://maps.googleapis.com/maps/api/directions/json?origin={origin}&destination={destination}&mode={mode}&key={google_maps_api_key}"
                
                logging.info(f"Calling Google Maps API: {url}")
                
                async with aiohttp.ClientSession() as session:
                    async with session.get(url) as response:
                        logging.info(f"Google Maps API response status: {response.status}")
                        
                        if response.status == 200:
                            data = await response.json()
                            logging.info(f"Google Maps API response: {data}")
                            
                            if data['status'] == 'OK' and data['routes']:
                                # 実際の道路ルートを取得
                                route = data['routes'][0]
                                leg = route['legs'][0]
                                
                                # 詳細なルートポイントを取得
                                for step in leg['steps']:
                                    # 各ステップの開始点と終了点を追加
                                    detailed_route.append({
                                        "lat": step['start_location']['lat'],
                                        "lng": step['start_location']['lng']
                                    })
                                
                                # 最後のステップの終了点を追加
                                detailed_route.append({
                                    "lat": leg['steps'][-1]['end_location']['lat'],
                                    "lng": leg['steps'][-1]['end_location']['lng']
                                })
                                
                                logging.info(f"Google Maps route generated with {len(leg['steps'])} steps")
                            else:
                                # Google Maps APIが失敗した場合、フォールバック
                                logging.warning(f"Google Maps API failed: {data.get('status', 'Unknown error')}")
                                raise Exception("Google Maps API failed")
                        else:
                            raise Exception(f"Google Maps API request failed: {response.status}")
                            
        except Exception as e:
            logging.warning(f"Google Maps API error: {e}, using fallback")
            # フォールバック: シンプルな線形補間
            for i in range(len(route_points) - 1):
                current_point = route_points[i]
                next_point = route_points[i + 1]
                
                # 2点間の距離を計算
                distance = calculate_distance(
                    current_point["lat"], current_point["lng"],
                    next_point["lat"], next_point["lng"]
                )
                
                # 距離に応じて分割数を調整
                steps = max(10, min(30, int(distance * 5)))
                
                for step in range(steps + 1):
                    t = step / steps
                    lat = current_point["lat"] + (next_point["lat"] - current_point["lat"]) * t
                    lng = current_point["lng"] + (next_point["lng"] - current_point["lng"]) * t
                    detailed_route.append({"lat": lat, "lng": lng})
    else:
        logging.warning("Google Maps API key not found, using fallback")
        # APIキーがない場合のフォールバック
        for i in range(len(route_points) - 1):
            current_point = route_points[i]
            next_point = route_points[i + 1]
            
            distance = calculate_distance(
                current_point["lat"], current_point["lng"],
                next_point["lat"], next_point["lng"]
            )
            
            steps = max(10, min(30, int(distance * 5)))
            
            for step in range(steps + 1):
                t = step / steps
                lat = current_point["lat"] + (next_point["lat"] - current_point["lat"]) * t
                lng = current_point["lng"] + (next_point["lng"] - current_point["lng"]) * t
                detailed_route.append({"lat": lat, "lng": lng})
    
    logging.info(f"Fallback calculation complete: total_distance={total_distance:.2f}km, travel_time={total_travel_time:.1f}min, visit_time={total_visit_time}min, total_time={total_time:.1f}min")
    logging.info(f"Generated detailed route with {len(detailed_route)} points")
    
    return {
        "total_distance": round(total_distance, 2),
        "total_time": int(total_time),
        "transport_mode": transport_mode,
        "route_points": route_points,
        "detailed_route": detailed_route,
        "summary": {
            "total_spots": len(spots),
            "travel_time": int(total_travel_time),
            "visit_time": total_visit_time,
            "return_to_start": return_to_start
        }
    }

# 画像アップロード・管理エンドポイント

@app.post("/api/upload/image")
async def upload_image(image: UploadFile = File(...)):
    """画像をアップロードしてIDを返す"""
    try:
        # ファイル形式チェック
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="画像ファイルのみアップロード可能です")
        
        # ファイルサイズチェック（5MB制限）
        content = await image.read()
        if len(content) > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(status_code=400, detail="ファイルサイズは5MB以下にしてください")
        
        # ユニークなファイル名を生成
        file_extension = image.filename.split('.')[-1] if image.filename and '.' in image.filename else 'jpg'
        image_id = f"{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / image_id
        
        # ファイルを保存
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        logger.info(f"Image uploaded: {image_id}, size: {len(content)} bytes")
        
        return {
            "success": True,
            "image_id": image_id,
            "url": f"/uploads/images/{image_id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail="画像のアップロードに失敗しました")

@app.get("/api/images/{image_id}")
async def get_image(image_id: str):
    """画像IDから画像ファイルを取得"""
    try:
        file_path = UPLOAD_DIR / image_id
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="画像が見つかりません")
        
        return FileResponse(
            path=file_path,
            media_type="image/*",
            headers={"Cache-Control": "public, max-age=3600"}  # 1時間キャッシュ
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving image {image_id}: {e}")
        raise HTTPException(status_code=500, detail="画像の取得に失敗しました")

@app.delete("/api/images/{image_id}")
async def delete_image(image_id: str):
    """画像を削除"""
    try:
        file_path = UPLOAD_DIR / image_id
        
        if file_path.exists():
            os.remove(file_path)
            logger.info(f"Image deleted: {image_id}")
        
        return {"success": True, "message": "画像が削除されました"}
        
    except Exception as e:
        logger.error(f"Error deleting image {image_id}: {e}")
        raise HTTPException(status_code=500, detail="画像の削除に失敗しました")

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """2点間の距離を計算（km）"""
    import math
    
    # ハバーサイン公式
    R = 6371  # 地球の半径（km）
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

# 選択リスト管理エンドポイント

@app.get("/api/options/categories", response_model=List[OptionCategory])
async def get_option_categories():
    """全ての選択リストカテゴリを取得"""
    try:
        categories = await option_service.get_all_categories()
        return categories
    except Exception as e:
        logger.error(f"Error getting option categories: {e}")
        raise HTTPException(status_code=500, detail="選択リストカテゴリの取得に失敗しました")

@app.get("/api/options/categories/{category_name}", response_model=OptionCategoryWithItems)
async def get_option_category_with_items(category_name: str):
    """カテゴリと項目を取得"""
    try:
        category = await option_service.get_category_with_items(category_name)
        if not category:
            raise HTTPException(status_code=404, detail="カテゴリが見つかりません")
        return category
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting option category: {e}")
        raise HTTPException(status_code=500, detail="カテゴリの取得に失敗しました")

@app.post("/api/options/categories", response_model=OptionCategory)
async def create_option_category(category_data: OptionCategoryCreate):
    """選択リストカテゴリを作成"""
    try:
        category = await option_service.create_category(category_data)
        return category
    except Exception as e:
        logger.error(f"Error creating option category: {e}")
        raise HTTPException(status_code=500, detail="カテゴリの作成に失敗しました")

@app.put("/api/options/categories/{category_name}", response_model=OptionCategory)
async def update_option_category(category_name: str, category_data: OptionCategoryUpdate):
    """選択リストカテゴリを更新"""
    try:
        category = await option_service.update_category(category_name, category_data)
        if not category:
            raise HTTPException(status_code=404, detail="カテゴリが見つかりません")
        return category
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating option category: {e}")
        raise HTTPException(status_code=500, detail="カテゴリの更新に失敗しました")

@app.delete("/api/options/categories/{category_name}")
async def delete_option_category(category_name: str):
    """選択リストカテゴリを削除"""
    try:
        success = await option_service.delete_category(category_name)
        if not success:
            raise HTTPException(status_code=404, detail="カテゴリが見つかりません")
        return {"success": True, "message": "カテゴリが削除されました"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting option category: {e}")
        raise HTTPException(status_code=500, detail="カテゴリの削除に失敗しました")

@app.get("/api/options/{category_name}/items", response_model=List[OptionItem])
async def get_option_items(category_name: str):
    """カテゴリの選択リスト項目を取得"""
    try:
        items = await option_service.get_items_by_category(category_name)
        return items
    except Exception as e:
        logger.error(f"Error getting option items: {e}")
        raise HTTPException(status_code=500, detail="選択リスト項目の取得に失敗しました")

@app.post("/api/options/{category_name}/items", response_model=OptionItem)
async def create_option_item(category_name: str, item_data: OptionItemCreate):
    """選択リスト項目を作成"""
    try:
        item = await option_service.create_item(category_name, item_data)
        return item
    except Exception as e:
        logger.error(f"Error creating option item: {e}")
        raise HTTPException(status_code=500, detail="選択リスト項目の作成に失敗しました")

@app.put("/api/options/items/{item_id}", response_model=OptionItem)
async def update_option_item(item_id: str, item_data: OptionItemUpdate):
    """選択リスト項目を更新"""
    try:
        item = await option_service.update_item(item_id, item_data)
        if not item:
            raise HTTPException(status_code=404, detail="項目が見つかりません")
        return item
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating option item: {e}")
        raise HTTPException(status_code=500, detail="選択リスト項目の更新に失敗しました")

@app.delete("/api/options/items/{item_id}")
async def delete_option_item(item_id: str):
    """選択リスト項目を削除"""
    try:
        success = await option_service.delete_item(item_id)
        if not success:
            raise HTTPException(status_code=404, detail="項目が見つかりません")
        return {"success": True, "message": "項目が削除されました"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting option item: {e}")
        raise HTTPException(status_code=500, detail="選択リスト項目の削除に失敗しました")

@app.post("/api/options/{category_name}/items/reorder")
async def reorder_option_items(category_name: str, item_orders: List[dict]):
    """選択リスト項目の並び順を変更"""
    try:
        success = await option_service.reorder_items(category_name, item_orders)
        if not success:
            raise HTTPException(status_code=400, detail="並び順の変更に失敗しました")
        return {"success": True, "message": "並び順が更新されました"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reordering option items: {e}")
        raise HTTPException(status_code=500, detail="並び順の変更に失敗しました")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
