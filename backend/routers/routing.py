from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import os
import requests

router = APIRouter(prefix="/routing", tags=["routing"])
ORS_API_KEY = os.getenv("ORS_API_KEY")
ORS_BASE = "https://api.openrouteservice.org/v2/directions"

class OrsRouteReq(BaseModel):
    # フロントから来る点（たぶん [lat, lng]）
    points: list[list[float]] = Field(..., description="[lat, lng] の配列を想定")
    transport_mode: str = Field(..., description="'walking'|'cycling'|'driving' など")

def to_ors_profile(mode: str) -> str:
    m = mode.lower()
    if m in ("walking", "foot", "walk"):
        return "foot-walking"
    if m in ("cycling", "bicycle", "bike"):
        return "cycling-regular"
    if m in ("driving", "car", "auto"):
        return "driving-car"
    # デフォルトは歩きに倒す
    return "foot-walking"

@router.post("/ors")
def create_route(req: OrsRouteReq):
    if not ORS_API_KEY:
        raise HTTPException(500, "ORS_API_KEY not set")

    # デバッグ: 受信したデータをログ出力
    print(f"Received request: transport_mode={req.transport_mode}, points_count={len(req.points)}")
    print(f"First 2 points: {req.points[:2]}")

    # 座標数を制限（ORSの制限: 70以下）
    if len(req.points) > 70:
        print(f"Too many points ({len(req.points)}), limiting to 70")
        req.points = req.points[:70]

    # 1) [lat,lng] -> [lng,lat] に変換
    def latlng_to_lnglat(pt):
        if len(pt) != 2:
            raise HTTPException(400, f"invalid point: {pt}")
        lat, lng = pt[0], pt[1]
        # ありえない範囲を弾く
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            raise HTTPException(400, f"point out of range: {pt}")
        return [lng, lat]

    coords = [latlng_to_lnglat(p) for p in req.points]

    # 2) 同一点の連続を削除（たまにある）
    def dedupe(seq):
        out = []
        last = None
        for c in seq:
            if c != last:
                out.append(c)
                last = c
        return out
    coords = dedupe(coords)

    if len(coords) < 2:
        raise HTTPException(400, "need at least 2 coordinates")

    profile = to_ors_profile(req.transport_mode)
    print(f"ORS profile: {profile}")
    print(f"Converted coordinates: {coords[:2]}")

    url = f"{ORS_BASE}/{profile}/geojson"
    payload = {
        "coordinates": coords,        # [[lng,lat], [lng,lat], ...]
        "instructions": False
    }
    headers = {"Authorization": ORS_API_KEY, "Content-Type": "application/json"}

    print(f"ORS payload: {payload}")

    r = requests.post(url, json=payload, headers=headers, timeout=20)
    if r.status_code != 200:
        # 失敗理由をそのまま返してデバッグしやすく
        print(f"ORS error response: {r.text}")
        raise HTTPException(r.status_code, r.text)

    return r.json()
