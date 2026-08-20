import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  Search,
  Navigation,
  MapPin,
  Check,
  Loader2,
  X,
  Crosshair,
  Compass,
} from "lucide-react";

// Fix default Leaflet marker icon asset issue by using custom SVG DivIcon
const createCustomPinIcon = () => {
  return L.divIcon({
    className: "custom-map-pin",
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
        <div style="width: 32px; height: 32px; background-color: #2563eb; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
          <div style="width: 10px; height: 10px; background-color: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>
        <div style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); width: 10px; height: 4px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(1px);"></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
};

interface LocationPickerMapProps {
  initialCoords: { lat: number; lng: number };
  initialAddress: string;
  onLocationChange: (coords: { lat: number; lng: number }, address: string) => void;
  onClose?: () => void;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  initialCoords,
  initialAddress,
  onLocationChange,
  onClose,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>(initialCoords);
  const [currentAddress, setCurrentAddress] = useState<string>(initialAddress);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  // Reverse geocoding helper (OpenStreetMap Nominatim Free API)
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const road = addr.road || addr.suburb || addr.neighbourhood || addr.residential || "";
        const ward = addr.suburb || addr.city_district || addr.quarter || "";
        const city = addr.city || addr.town || addr.state_district || "Ranchi";
        const state = addr.state || "Jharkhand";

        const formatted = [road, ward, city, state].filter(Boolean).join(", ");
        const finalAddr = formatted || `Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
        setCurrentAddress(finalAddr);
        onLocationChange({ lat, lng }, finalAddr);
      } else {
        const fallback = `Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
        setCurrentAddress(fallback);
        onLocationChange({ lat, lng }, fallback);
      }
    } catch (err) {
      const fallback = `Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
      setCurrentAddress(fallback);
      onLocationChange({ lat, lng }, fallback);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialCoords.lat, initialCoords.lng],
        zoom: 16,
        zoomControl: false,
      });

      // Free OpenStreetMap Tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add custom draggable marker
      const pinIcon = createCustomPinIcon();
      const marker = L.marker([initialCoords.lat, initialCoords.lng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      // Drag event
      marker.on("dragend", () => {
        const position = marker.getLatLng();
        setCurrentCoords({ lat: position.lat, lng: position.lng });
        reverseGeocode(position.lat, position.lng);
      });

      // Map Click event: Tap anywhere to place pin
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCurrentCoords({ lat, lng });
        reverseGeocode(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Invalidate map size after animation render
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update map and marker when current coordinates change from search/GPS
  const updateMapPosition = (lat: number, lng: number, zoomLevel = 17) => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], zoomLevel, { animate: true });
      markerRef.current.setLatLng([lat, lng]);
      setCurrentCoords({ lat, lng });
      reverseGeocode(lat, lng);
    }
  };

  // Search places via Free Nominatim API
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error("Search geocoding error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Select place from search list
  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const displayName = result.display_name;
    setSearchQuery("");
    setSearchResults([]);
    setCurrentAddress(displayName);
    updateMapPosition(lat, lng, 17);
    onLocationChange({ lat, lng }, displayName);
  };

  // Device GPS Re-center
  const handleGetLiveGPS = () => {
    setIsLocatingGPS(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          updateMapPosition(lat, lng, 18);
          setIsLocatingGPS(false);
        },
        (err) => {
          console.warn("GPS error:", err);
          setIsLocatingGPS(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsLocatingGPS(false);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm animate-fadeIn flex flex-col h-80 sm:h-96">
      {/* 1. Map Search Overlay Bar on top of map */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-[1000] space-y-1">
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex items-center bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/90 overflow-hidden"
        >
          <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search road, landmark, ward or area..."
            className="w-full text-xs sm:text-sm pl-9 pr-20 py-2.5 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 font-medium"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching}
              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              {isSearching ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <span>Find</span>
              )}
            </button>
          </div>
        </form>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 divide-y divide-slate-100 max-h-40 overflow-y-auto no-scrollbar">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSearchResult(item)}
                className="w-full text-left p-2.5 text-xs hover:bg-blue-50 transition-colors flex items-start gap-2 cursor-pointer text-slate-800"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span className="truncate">{item.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Primary Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-[10]" />

      {/* 3. Floating Map Controls (GPS Re-center & Zoom) */}
      <div className="absolute right-2.5 bottom-16 z-[1000] flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleGetLiveGPS}
          disabled={isLocatingGPS}
          className="w-9 h-9 bg-white/95 backdrop-blur-md hover:bg-white text-blue-600 rounded-xl shadow-md border border-slate-200 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Locate My Current GPS"
        >
          {isLocatingGPS ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 fill-blue-600 text-blue-600" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.zoomIn();
            }
          }}
          className="w-9 h-9 bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 rounded-xl shadow-md border border-slate-200 flex items-center justify-center font-bold text-base transition-all cursor-pointer"
          title="Zoom In"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.zoomOut();
            }
          }}
          className="w-9 h-9 bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 rounded-xl shadow-md border border-slate-200 flex items-center justify-center font-bold text-base transition-all cursor-pointer"
          title="Zoom Out"
        >
          −
        </button>
      </div>

      {/* 4. Bottom Location Details & Confirmation Bar */}
      <div className="absolute bottom-0 inset-x-0 z-[1000] bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                Pinned Location
              </span>
              {isReverseGeocoding && (
                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Resolving...
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-slate-900 truncate leading-tight mt-0.5">
              {currentAddress}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              {currentCoords.lat.toFixed(5)}°N, {currentCoords.lng.toFixed(5)}°E • Tap or drag pin to adjust
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Confirm</span>
          </button>
        )}
      </div>
    </div>
  );
};
