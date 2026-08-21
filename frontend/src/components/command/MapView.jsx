import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { NAGPUR, DEFAULT_ZOOM } from "@/lib/command";

const makeIcon = (color, { pulse = false, glyph = "" } = {}) =>
  L.divIcon({
    className: "cc-marker",
    html: `<span class="cc-pin ${pulse ? "cc-pin-pulse" : ""}" style="--pin:${color}">${glyph}</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 14), {
      duration: 0.9,
    });
  }, [center, map]);
  return null;
}

function ClickCapture({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapView({
  markers = [],
  onMapClick,
  flyTo,
  cursorCrosshair = false,
  className = "",
}) {
  return (
    <div className="absolute inset-0 w-full h-full" data-testid="command-map">
    <MapContainer
      center={[NAGPUR.lat, NAGPUR.lng]}
      zoom={DEFAULT_ZOOM}
      zoomControl={false}
      className={`cc-map ${cursorCrosshair ? "cc-map-select" : ""} ${className}`}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />
      {onMapClick && <ClickCapture onMapClick={onMapClick} />}
      {flyTo && <Recenter center={flyTo} />}
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={makeIcon(m.color, { pulse: m.pulse, glyph: m.glyph })}
          eventHandlers={m.onClick ? { click: () => m.onClick(m) } : undefined}
        />
      ))}
    </MapContainer>
    </div>
  );
}
