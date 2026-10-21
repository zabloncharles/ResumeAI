import { locationStringForUsState } from "../constants/usStateCentroids";

function formatCoords(lat: number, lng: number, precision = 4): string {
  return `${lat.toFixed(precision)},${lng.toFixed(precision)}`;
}

async function coordsFromZip(zip: string): Promise<string> {
  const clean = zip.trim();
  if (!clean) return "";
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${clean}`);
    if (!res.ok) return "";
    const data = await res.json();
    if (!data.places?.[0]) return "";
    const lat = parseFloat(data.places[0].latitude);
    const lng = parseFloat(data.places[0].longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return "";
    const randLat = lat + (Math.random() - 0.5) * 0.02;
    const randLng = lng + (Math.random() - 0.5) * 0.02;
    return formatCoords(randLat, randLng);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Zip location lookup failed:", error);
    }
    return "";
  }
}

type IpRegionResult = {
  regionCode: string;
  location: string;
};

async function regionFromIp(seed = ""): Promise<IpRegionResult | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.error) return null;

    const country = String(data.country_code || data.country || "").toUpperCase();
    const regionCode = String(data.region_code || data.region || "").trim();
    if (country && country !== "US") {
      const lat = Number(data.latitude);
      const lng = Number(data.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return {
          regionCode: regionCode || country,
          location: formatCoords(lat, lng),
        };
      }
      return null;
    }

    if (!regionCode) return null;
    const location = locationStringForUsState(regionCode, seed);
    if (!location) return null;
    return { regionCode: regionCode.toUpperCase(), location };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("IP region lookup failed:", error);
    }
    return null;
  }
}

export async function resolveUserLocationCoords(input: {
  zip?: string;
  state?: string;
  seed?: string;
}): Promise<{ location: string; detectedState?: string }> {
  const seed = input.seed || input.zip || "";

  const fromZip = await coordsFromZip(input.zip || "");
  if (fromZip) {
    return { location: fromZip };
  }

  const fromState = locationStringForUsState(input.state || "", seed);
  if (fromState) {
    return { location: fromState };
  }

  const fromIp = await regionFromIp(seed);
  if (fromIp) {
    return {
      location: fromIp.location,
      detectedState: fromIp.regionCode,
    };
  }

  return { location: "" };
}
