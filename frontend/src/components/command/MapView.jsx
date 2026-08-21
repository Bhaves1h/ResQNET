import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap, useMapEvents } from "react-leaflet";
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
  routes = [],
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
        attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; OpenStreetMap contributors'
        url={`https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${process.env.REACT_APP_MAPTILER_API_KEY}`}
        tileSize={256}
      />
      {onMapClick && <ClickCapture onMapClick={onMapClick} />}
      {flyTo && <Recenter center={flyTo} />}
      {routes.map((route) => (
        <Polyline
          key={route.id}
          positions={[[route.from.lat, route.from.lng], [route.to.lat, route.to.lng]]}
          pathOptions={{ color: route.color || "#5aa9ff", weight: 2.5, opacity: 0.85, dashArray: "1 10", className: "cc-route" }}
        />
      ))}
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={makeIcon(m.color, { pulse: m.pulse, glyph: m.glyph })}
          eventHandlers={m.onClick ? { click: () => m.onClick(m) } : undefined}
        >
          {m.tooltip && (
            <Tooltip direction="top" offset={[0, -14]} opacity={0.95} className="cc-tooltip">
              {m.tooltip}
            </Tooltip>
          )}
        </Marker>
      ))}
    </MapContainer>
    </div>
  );
}
