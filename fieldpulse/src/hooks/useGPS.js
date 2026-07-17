import { Geolocation } from "@capacitor/geolocation";

// Default fallback coords (Mumbai)
const FALLBACK = { lat: 19.0760, lng: 72.8777, accuracy: null, real: false, city: "Mumbai (fallback)" };

export async function captureLocation(callback) {
  try {
    // Attempt native Capacitor Geolocation first (triggers Android system permission dialog)
    const perm = await Geolocation.requestPermissions();
    if (perm.location === "granted" || perm.coarseLocation === "granted") {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
      callback({
        lat: +pos.coords.latitude.toFixed(6),
        lng: +pos.coords.longitude.toFixed(6),
        accuracy: Math.round(pos.coords.accuracy || 0),
        real: true,
        city: "Live location",
      });
      return;
    }
  } catch (err) {
    console.warn("Capacitor Geolocation error or non-native, falling back to Web Geolocation:", err);
  }

  // Fallback to standard Web Geolocation API
  if (!navigator.geolocation) {
    setTimeout(() => callback(FALLBACK), 600);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      callback({
        lat: +pos.coords.latitude.toFixed(6),
        lng: +pos.coords.longitude.toFixed(6),
        accuracy: Math.round(pos.coords.accuracy || 0),
        real: true,
        city: "Live location",
      });
    },
    (err) => {
      console.warn("Web Geolocation error:", err);
      setTimeout(() => callback(FALLBACK), 600);
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}
