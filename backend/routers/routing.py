from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import os
import httpx

router = APIRouter(prefix="/routing", tags=["routing"])

class RouteRequest(BaseModel):
    # フロントからは [lat, lng] で来る想定 → ORSは [lng, lat]
    coordinates: list[list[float]] = Field(..., description="[[lat,lng], [lat,lng], ...]")
    profile: str = Field("foot-walking", description="ORSのプロフィール: foot-walking, cycling-regular, driving-car など")

@router.post("/ors")
async def route_via_ors(req: RouteRequest):
    api_key = os.getenv("ORS_API_KEY")
    if not api_key:
        raise HTTPException(500, "ORS_API_KEY not set")

    # ORSは [lng,lat] 順。フロント想定 [lat,lng] を変換
    coords_lnglat = [[lng, lat] for lat, lng in req.coordinates]

    url = f"https://api.openrouteservice.org/v2/directions/{req.profile}/geojson"
    headers = {"Authorization": api_key}

    payload = {
        "coordinates": coords_lnglat,
        # 必要に応じて制約を追記可能
        # "options": {"avoid_features": ["ferries"]}
    }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(url, headers=headers, json=payload)
        if r.status_code == 429:
            raise HTTPException(429, "ORS rate limit")
        if r.status_code >= 400:
            raise HTTPException(r.status_code, r.text)
        return r.json()  # GeoJSON をそのまま返す
    except httpx.RequestError as e:
        raise HTTPException(502, f"ORS request failed: {e}")
