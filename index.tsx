import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Dynamic Google Maps Script Loader
 * Loads the Maps API key from environment variables to avoid hardcoding secrets.
 * Safely checks both process.env (common in CI/CD and AI Studio) and import.meta.env (Vite standard).
 */
const getGoogleMapsKey = () => {
  try {
    // Try process.env first as it's the standard for this environment's secrets
    if (typeof process !== 'undefined' && process.env && (process.env as any).NEXT_PUBLIC_GOOGLE_MAPS_KEY) {
      return (process.env as any).NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    }
    // Fallback to import.meta.env if available
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv.NEXT_PUBLIC_GOOGLE_MAPS_KEY) {
      return metaEnv.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    }
  } catch (e) {
    console.error("Error accessing environment variables:", e);
  }
  return null;
};

const googleMapsKey = getGoogleMapsKey();

if (googleMapsKey) {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
} else {
  console.warn("Google Maps key missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_KEY in environment variables.");
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);