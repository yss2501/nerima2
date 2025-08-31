export type LatLng = [number, number]; // [lat, lng]

export async function fetchOrsRoute(coords: LatLng[], profile = "foot-walking") {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nerima-backend.onrender.com'}/routing/ors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      points: coords, 
      transport_mode: profile === "foot-walking" ? "walking" : 
                     profile === "cycling-regular" ? "cycling" : "driving" 
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Routing failed: ${res.status} ${t}`);
  }
  return res.json(); // GeoJSON
}
