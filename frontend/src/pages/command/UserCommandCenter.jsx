import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { Map as MapIcon, ListChecks, Plus, LogOut } from "lucide-react";
import MapView from "@/components/command/MapView";
import CommandNav from "@/components/command/CommandNav";
import AddIncidentSheet from "@/components/command/AddIncidentSheet";
import UserStatusCard from "@/components/command/UserStatusCard";
import {
  API,
  NAGPUR,
  getRole,
  getReporterId,
  clearRole,
  SEVERITY_COLOR,
  computeEnRoute,
} from "@/lib/command";

const EMPTY_DRAFT = { type: null, agencies: [], description: "", lat: null, lng: null };

export default function UserCommandCenter() {
  const navigate = useNavigate();
  const [myLocation, setMyLocation] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [flyTo, setFlyTo] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [selectingOnMap, setSelectingOnMap] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showList, setShowList] = useState(false);
  const reporterId = useRef(getReporterId());

  useEffect(() => {
    if (getRole() !== "USER") navigate("/command");
  }, [navigate]);

  const fetchMine = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/incidents`, {
        params: { reporterId: reporterId.current },
      });
      setIncidents(r.data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchMine();
    const i = setInterval(fetchMine, 8000);
    return () => clearInterval(i);
  }, [fetchMine]);

  const loadDetail = useCallback(async (id) => {
    try {
      const r = await axios.get(`${API}/incidents/${id}`);
      setDetail(r.data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!selected) return;
    loadDetail(selected);
    const i = setInterval(() => loadDetail(selected), 6000);
    return () => clearInterval(i);
  }, [selected, loadDetail]);

  // Ticks the clock so an en-route unit's marker visibly moves toward the incident.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 800);
    return () => clearInterval(i);
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation unavailable — please select on the map instead");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLocation(loc);
        setDraft((d) => ({ ...d, lat: loc.lat, lng: loc.lng }));
        setFlyTo({ ...loc });
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast.error("Location permission denied — select on the map instead");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapClick = (loc) => {
    if (selectingOnMap) {
      setDraft((d) => ({ ...d, lat: loc.lat, lng: loc.lng }));
      setSelectingOnMap(false);
      setFlyTo({ ...loc });
    }
  };

  const openAdd = () => {
    setSelected(null);
    setDetail(null);
    setDraft(EMPTY_DRAFT);
    setAddOpen(true);
  };

  const submitReport = async () => {
    setSubmitting(true);
    try {
      const r = await axios.post(`${API}/incidents/report`, {
        type: draft.type,
        latitude: draft.lat,
        longitude: draft.lng,
        description: draft.description,
        requestedAgencies: draft.agencies,
        reporterId: reporterId.current,
      });
      toast.success("Incident reported — help is being notified");
      setAddOpen(false);
      setDraft(EMPTY_DRAFT);
      await fetchMine();
      setSelected(r.data.id);
      setFlyTo({ lat: r.data.latitude, lng: r.data.longitude });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Could not report incident");
    } finally {
      setSubmitting(false);
    }
  };

  const exit = () => {
    clearRole();
    navigate("/command");
  };

  const markers = [];
  const routes = [];
  if (myLocation && !addOpen)
    markers.push({ id: "me", ...myLocation, color: "#5aa9ff", glyph: "", pulse: true });
  if (draft.lat != null && addOpen)
    markers.push({ id: "draft", lat: draft.lat, lng: draft.lng, color: "#ffffff", pulse: true });
  incidents.forEach((inc) =>
    markers.push({
      id: inc.id,
      lat: inc.latitude,
      lng: inc.longitude,
      color: SEVERITY_COLOR[inc.severity] || "#ff8a3d",
      pulse: inc.status !== "RESOLVED",
      onClick: () => {
        setSelected(inc.id);
        setShowList(false);
        setFlyTo({ lat: inc.latitude, lng: inc.longitude });
      },
    })
  );
  // Visualize an en-route responder heading to the citizen's own open incident.
  if (detail && detail.id === selected) {
    (detail.assignments || [])
      .filter((a) => a.unit?.status === "EN_ROUTE")
      .forEach((a) => {
        const state = computeEnRoute(a, a.unit, detail);
        if (!state) return;
        routes.push({ id: `route-${a.id}`, from: state.origin, to: state.dest, color: "#5aa9ff" });
        markers.push({
          id: `unit-${a.unitId}`,
          lat: state.position.lat,
          lng: state.position.lng,
          color: "#5aa9ff",
          pulse: true,
          tooltip: `${a.unit.name} · EN ROUTE · ETA ${state.etaMinutes} min`,
        });
      });
  }

  const navItems = [
    { key: "map", label: "Map", icon: MapIcon },
    { key: "incidents", label: "My Incidents", icon: ListChecks },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05070a]" data-testid="user-command-center" data-tick={tick}>
      <Toaster theme="dark" position="top-center" />
      <MapView
        markers={markers}
        routes={routes}
        flyTo={flyTo}
        onMapClick={handleMapClick}
        cursorCrosshair={selectingOnMap}
      />

      <CommandNav
        items={navItems}
        active={showList ? "incidents" : "map"}
        onSelect={(k) => {
          if (k === "map") {
            setShowList(false);
            setFlyTo({ ...NAGPUR });
          } else setShowList(true);
        }}
        right={
          <>
            <span className="flex items-center gap-1.5 px-2.5 text-[11px] text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 cc-pin-pulse" /> LIVE
            </span>
            <button
              onClick={exit}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              data-testid="user-exit-button"
            >
              <LogOut size={14} />
            </button>
          </>
        }
      />

      {/* Incident list panel */}
      {showList && (
        <div
          className="absolute top-20 left-4 z-[1000] w-[300px] max-h-[70vh] overflow-y-auto cc-scroll liquid-glass-strong rounded-3xl p-4 flex flex-col gap-2 cc-sheet-in"
          data-testid="user-incident-list"
        >
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 px-1">
            My incidents ({incidents.length})
          </span>
          {incidents.length === 0 && (
            <p className="text-sm text-white/50 px-1 py-4">
              You haven't reported anything yet. Tap “Add incident”.
            </p>
          )}
          {incidents.map((inc) => (
            <button
              key={inc.id}
              onClick={() => {
                setSelected(inc.id);
                setShowList(false);
                setFlyTo({ lat: inc.latitude, lng: inc.longitude });
              }}
              className="liquid-glass rounded-2xl p-3 flex items-center gap-3 text-left hover:bg-white/10 transition-colors"
              data-testid={`user-incident-${inc.id}`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: SEVERITY_COLOR[inc.severity] }}
              />
              <div className="flex flex-col">
                <span className="text-sm text-white">{inc.title}</span>
                <span className="text-[11px] text-white/45">{inc.status}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Status panel (right) */}
      {selected && detail && !addOpen && (
        <div
          className="absolute top-20 right-4 z-[1000] w-[320px] max-w-[calc(100vw-2rem)]"
          data-testid="user-status-wrap"
        >
          <UserStatusCard incident={detail} onClose={() => { setSelected(null); setDetail(null); }} />
        </div>
      )}

      {/* Add incident FAB */}
      {!addOpen && (
        <button
          onClick={openAdd}
          className="fixed bottom-6 right-6 z-[1050] bg-white text-black rounded-full pl-5 pr-6 py-4 flex items-center gap-2.5 text-sm font-medium shadow-2xl hover:scale-105 active:scale-95 transition-transform duration-300"
          data-testid="add-incident-fab"
        >
          <Plus size={18} /> Add incident
        </button>
      )}

      {addOpen && (
        <AddIncidentSheet
          draft={draft}
          setDraft={setDraft}
          minimized={selectingOnMap}
          onUseLocation={useMyLocation}
          onSelectOnMap={() => setSelectingOnMap(true)}
          onSubmit={submitReport}
          submitting={submitting}
          locating={locating}
          onClose={() => {
            setAddOpen(false);
            setSelectingOnMap(false);
          }}
        />
      )}
    </div>
  );
}
