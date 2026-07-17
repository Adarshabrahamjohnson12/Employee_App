import { Geolocation } from "@capacitor/geolocation";

const FALLBACK = {
  lat: 19.0760,
  lng: 72.8777,
  accuracy: null,
  real: false,
  city: "Mumbai (fallback)"
};

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

export async function captureLocation(callback) {
  // 1. Try Capacitor Native Geolocation first if available
  if (window.Capacitor && Geolocation) {
    try {
      const permission = await Geolocation.requestPermissions();
      if (permission.location === "granted" || permission.location === "prompt") {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 12000,
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
      console.warn("Capacitor Geolocation error, falling back to browser navigator:", err);
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
      (err) => {
        console.warn("Navigator geolocation error:", err);
        callback(FALLBACK);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return;
  }

  // 3. Fallback if no geolocation available
  setTimeout(() => callback(FALLBACK), 400);
}
