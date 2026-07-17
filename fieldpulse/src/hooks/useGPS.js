import { Geolocation } from "@capacitor/geolocation";

const DEFAULT_FALLBACK = {
  lat: 19.0760,
  lng: 72.8777,
  accuracy: null,
  real: false,
  city: "Live Location"
};

// Reverse geocode lat/lng to city name
async function fetchCityName(lat, lng) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    const data = await res.json();
    const city =
      data.locality ||
      data.city ||
      data.principalSubdivision ||
      data.localityInfo?.informative?.[0]?.name ||
      "Live Location";
    return city;
  } catch (e) {
    return "Live Location";
  }
}

// IP-based Geolocation fallback if GPS permission is denied or fails
async function fetchIpLocation() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    if (data && data.latitude && data.longitude) {
      return {
        lat: +data.latitude.toFixed(6),
        lng: +data.longitude.toFixed(6),
        accuracy: 2500,
        real: false,
        city: `${data.city || data.region || "Live Location"} (IP network)`
      };
    }
  } catch (e) {
    console.warn("IP Geolocation failed:", e);
  }
  return DEFAULT_FALLBACK;
}

export async function captureLocation(callback) {
  // 1. Try Capacitor Native Geolocation on mobile devices
  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    try {
      let perm = await Geolocation.checkPermissions();
      if (perm.location !== "granted") {
        perm = await Geolocation.requestPermissions();
      }
      if (perm.location === "granted") {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
        const lat = +pos.coords.latitude.toFixed(6);
        const lng = +pos.coords.longitude.toFixed(6);
        const accuracy = Math.round(pos.coords.accuracy || 0);
        const city = await fetchCityName(lat, lng);

        callback({ lat, lng, accuracy, real: true, city });
        return;
      }
    } catch (err) {
      console.warn("Capacitor Geolocation error:", err);
    }
  }

  // 2. Try Standard Browser Geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = +pos.coords.latitude.toFixed(6);
        const lng = +pos.coords.longitude.toFixed(6);
        const accuracy = Math.round(pos.coords.accuracy || 0);
        const city = await fetchCityName(lat, lng);

        callback({ lat, lng, accuracy, real: true, city });
      },
      async (err) => {
        console.warn("Navigator geolocation error, using IP lookup fallback:", err);
        const ipLoc = await fetchIpLocation();
        callback(ipLoc);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
    return;
  }

  // 3. IP Geolocation fallback
  const ipLoc = await fetchIpLocation();
  callback(ipLoc);
}
