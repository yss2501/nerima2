export type LatLng = [number, number]; // [lat, lng]

export async function fetchOrsRoute(coords: LatLng[], profile = "foot-walking") {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'https://nerima-back.onrender.com'}/routing/ors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coordinates: coords, profile }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Routing failed: ${res.status} ${t}`);
  }
  return res.json(); // GeoJSON
}
