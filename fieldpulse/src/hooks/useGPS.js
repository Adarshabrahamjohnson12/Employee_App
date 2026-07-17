// Default fallback coords (Mumbai)
const FALLBACK = { lat: 19.0760, lng: 72.8777, accuracy: null, real: false, city: "Mumbai (fallback)" };

export function captureLocation(callback) {
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
    () => setTimeout(() => callback(FALLBACK), 600),
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}
