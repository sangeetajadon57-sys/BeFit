/**
 * Safe API Endpoint resolver for Cordova/Capacitor Hybrid Mobile APKs & slow mobile internet interfaces.
 * Dynamically switches from relative URLs (browser) to absolute production URLs (APK context)
 * so that both the food scanner and the AI chatbot work flawlessly.
 */
export function getApiUrl(endpoint: string): string {
  // Clean endpoint prefix
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (typeof window === 'undefined') {
    return cleanEndpoint;
  }

  const origin = window.location.origin;

  // APK environments usually render files under file://, capacitor://, ionic://,
  // or simple local origins where local server endpoints aren't running.
  const isApkScheme =
    !origin ||
    origin.startsWith('file:') ||
    origin.startsWith('capacitor:') ||
    origin.startsWith('ionic:') ||
    origin.startsWith('chrome-extension:') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1');

  if (isApkScheme) {
    // Falls back to VITE_API_BASE_URL if configured
    const envBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL;
    if (envBaseUrl) {
      const base = envBaseUrl.endsWith('/') ? envBaseUrl.slice(0, -1) : envBaseUrl;
      return `${base}${cleanEndpoint}`;
    }

    // Default to this applet's production Cloud Run endpoint
    const defaultProdUrl = "https://ais-pre-jjousxwpp6xqgdyaggzuc5-929132930593.asia-southeast1.run.app";
    return `${defaultProdUrl}${cleanEndpoint}`;
  }

  // Standalone browser client defaults to native relative path routing
  return cleanEndpoint;
}
