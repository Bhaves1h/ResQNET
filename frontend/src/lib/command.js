import {
  Flame,
  HeartPulse,
  Car,
  Waves,
  Building2,
  AlertTriangle,
  Ambulance,
  Shield,
  LifeBuoy,
  Search,
} from "lucide-react";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Nagpur demo center
export const NAGPUR = { lat: 21.1458, lng: 79.0882 };
export const DEFAULT_ZOOM = 12;

export const INCIDENT_TYPES = [
  { key: "FIRE", label: "Fire", icon: Flame },
  { key: "MEDICAL", label: "Medical Emergency", icon: HeartPulse },
  { key: "ROAD_ACCIDENT", label: "Accident", icon: Car },
  { key: "FLOOD", label: "Flood", icon: Waves },
  { key: "BUILDING_COLLAPSE", label: "Building Collapse", icon: Building2 },
  { key: "OTHER", label: "Other", icon: AlertTriangle },
];

export const AGENCY_TYPES = [
  { key: "medical", label: "Medical", icon: Ambulance },
  { key: "fire", label: "Fire & Rescue", icon: Flame },
  { key: "police", label: "Police", icon: Shield },
  { key: "disaster_response", label: "Disaster Response", icon: LifeBuoy },
  { key: "rescue", label: "Search & Rescue", icon: Search },
];

export const incidentLabel = (key) =>
  INCIDENT_TYPES.find((t) => t.key === key)?.label || "Emergency";
export const agencyTypeLabel = (key) =>
  AGENCY_TYPES.find((t) => t.key === key)?.label || key;

export const SEVERITY_COLOR = {
  CRITICAL: "#ff4d4d",
  HIGH: "#ff8a3d",
  MODERATE: "#ffce4d",
  LOW: "#8ad1ff",
};

export const STATUS_LABEL = {
  REPORTED: "Reported",
  ASSESSING: "Being assessed",
  RESPONDING: "Responding",
  ON_SCENE: "On scene",
  CONTROLLED: "Controlled",
  RESOLVED: "Resolved",
  CANCELLED: "Cancelled",
};

// ---- local identity (frictionless) ----
const REPORTER_KEY = "resqnet_reporter_id";
const ROLE_KEY = "resqnet_cc_role";
const AGENCY_KEY = "resqnet_cc_agency";

export const getReporterId = () => {
  let id = localStorage.getItem(REPORTER_KEY);
  if (!id) {
    id = `citizen-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(REPORTER_KEY, id);
  }
  return id;
};

export const setRole = (role) => localStorage.setItem(ROLE_KEY, role);
export const getRole = () => localStorage.getItem(ROLE_KEY);
export const clearRole = () => {
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(AGENCY_KEY);
};

export const setAgency = (agency) =>
  localStorage.setItem(AGENCY_KEY, JSON.stringify(agency));
export const getAgency = () => {
  try {
    return JSON.parse(localStorage.getItem(AGENCY_KEY));
  } catch {
    return null;
  }
};

export const km = (a, b) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(s));
};

// ---- simulated en-route motion (matches backend AVG_RESPONSE_SPEED_KMH) ----
export const AVG_SPEED_KMH = 30;

const lerp = (a, b, t) => a + (b - a) * t;

// Derives a unit's current simulated position + ETA purely from the persisted
// dispatch timestamp + static coordinates — safe to recompute after a refresh.
export const computeEnRoute = (assignment, unit, incident) => {
  if (!assignment?.dispatchedAt || !unit || !incident) return null;
  const origin = { lat: unit.latitude, lng: unit.longitude };
  const dest = { lat: incident.latitude, lng: incident.longitude };
  const distanceKm = km(origin, dest);
  const totalMinutes = Math.max(0.5, (distanceKm / AVG_SPEED_KMH) * 60);
  const elapsedMinutes = (Date.now() - new Date(assignment.dispatchedAt).getTime()) / 60000;
  const fraction = Math.min(1, Math.max(0, elapsedMinutes / totalMinutes));
  return {
    position: { lat: lerp(origin.lat, dest.lat, fraction), lng: lerp(origin.lng, dest.lng, fraction) },
    origin,
    dest,
    fraction,
    etaMinutes: Math.max(0, Math.ceil(totalMinutes - elapsedMinutes)),
    arrived: fraction >= 1,
  };
};
