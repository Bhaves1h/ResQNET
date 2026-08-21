import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { Map as MapIcon, Siren, Truck, LogOut } from "lucide-react";
import MapView from "@/components/command/MapView";
import CommandNav from "@/components/command/CommandNav";
import AgencyIncidentPanel from "@/components/command/AgencyIncidentPanel";
import AgencyUnitsPanel from "@/components/command/AgencyUnitsPanel";
import { API, NAGPUR, getRole, getAgency, clearRole, SEVERITY_COLOR } from "@/lib/command";

const UNIT_COLOR = {
  AVAILABLE: "#4ade80",
  EN_ROUTE: "#5aa9ff",
  ON_SCENE: "#ffce4d",
  BUSY: "#facc15",
  OFFLINE: "#6b7280",
  COMPLETED: "#a1a1aa",
};

export default function AgencyCommandCenter() {
  const navigate = useNavigate();
  const [agency] = useState(() => getAgency());
  const [incidents, setIncidents] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [showList, setShowList] = useState(true);
  const [showUnits, setShowUnits] = useState(false);

  const [recs, setRecs] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [accepting, setAccepting] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  const headers = agency
    ? { "X-Role": "AGENCY_OPERATOR", "X-Agency-Id": agency.id }
    : {};

  useEffect(() => {
    if (getRole() !== "AGENCY" || !getAgency()) navigate("/command");
  }, [navigate]);

  const fetchAll = useCallback(async () => {
    if (!agency) return;
    try {
      const [incRes, unitRes] = await Promise.all([
        axios.get(`${API}/agencies/${agency.id}/incidents`),
        axios.get(`${API}/units`, { params: { agencyId: agency.id } }),
      ]);
      setIncidents(incRes.data);
      setUnits(unitRes.data);
    } catch {
      toast.error("Could not reach the ResQNet network");
    }
  }, [agency]);

  useEffect(() => {
    fetchAll();
    const i = setInterval(fetchAll, 8000);
    return () => clearInterval(i);
  }, [fetchAll]);

  const loadDetail = useCallback(async (id) => {
    const r = await axios.get(`${API}/incidents/${id}`);
    setDetail(r.data);
    return r.data;
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const i = setInterval(() => loadDetail(selectedId).catch(() => {}), 6000);
    return () => clearInterval(i);
  }, [selectedId, loadDetail]);

  const generateRecs = useCallback(
    async (id) => {
      setRecsLoading(true);
      try {
        const r = await axios.get(`${API}/incidents/${id}/recommendations`, {
          params: { agencyId: agency.id },
        });
        setRecs(r.data);
        setSelectedUnits(r.data.recommendations.slice(0, 1).map((x) => x.unitId));
      } catch {
        toast.error("Could not score units");
      } finally {
        setRecsLoading(false);
      }
    },
    [agency]
  );

  const selectIncident = async (id) => {
    setSelectedId(id);
    setShowUnits(false);
    setShowList(false);
    setRecs(null);
    setSelectedUnits([]);
    const d = await loadDetail(id).catch(() => null);
    if (d) {
      setFlyTo({ lat: d.latitude, lng: d.longitude });
      if ((d.responses || []).some((r) => r.agencyId === agency.id)) generateRecs(id);
    }
  };

  const accept = async () => {
    setAccepting(true);
    try {
      await axios.post(`${API}/incidents/${selectedId}/accept`, { agencyId: agency.id }, { headers });
      toast.success("Response accepted");
      await loadDetail(selectedId);
      await generateRecs(selectedId);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Could not accept");
    } finally {
      setAccepting(false);
    }
  };

  const toggleUnit = (id) =>
    setSelectedUnits((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const dispatch = async () => {
    setDispatching(true);
    try {
      await axios.post(
        `${API}/incidents/${selectedId}/dispatch`,
        { unitIds: selectedUnits },
        { headers }
      );
      toast.success(`Dispatched ${selectedUnits.length} unit(s) — EN ROUTE`);
      setSelectedUnits([]);
      await Promise.all([fetchAll(), loadDetail(selectedId)]);
      await generateRecs(selectedId);
    } catch (err) {
      const e = err.response?.data?.error;
      toast.error(e?.message || "Dispatch failed");
    } finally {
      setDispatching(false);
    }
  };

  const updateUnitStatus = async (unitId, status) => {
    try {
      await axios.patch(`${API}/units/${unitId}/status`, { status }, { headers });
      toast.success(`Unit → ${status.replace(/_/g, " ")}`);
      await fetchAll();
      if (selectedId) loadDetail(selectedId);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Update failed");
    }
  };

  const exit = () => {
    clearRole();
    navigate("/command");
  };

  if (!agency) return null;

  const accepted = (detail?.responses || []).some((r) => r.agencyId === agency.id);

  const markers = [];
  incidents.forEach((inc) =>
    markers.push({
      id: inc.id,
      lat: inc.latitude,
      lng: inc.longitude,
      color: SEVERITY_COLOR[inc.severity] || "#ff8a3d",
      pulse: inc.id === selectedId || inc.status === "REPORTED",
      onClick: () => selectIncident(inc.id),
    })
  );
  units.forEach((u) =>
    markers.push({
      id: u.id,
      lat: u.latitude,
      lng: u.longitude,
      color: UNIT_COLOR[u.status] || "#4ade80",
    })
  );

  const navItems = [
    { key: "map", label: "Map", icon: MapIcon },
    { key: "incidents", label: "Incidents", icon: Siren },
    { key: "units", label: "My Units", icon: Truck },
  ];

  const onNav = (k) => {
    if (k === "map") {
      setShowList(false);
      setShowUnits(false);
      setFlyTo({ ...NAGPUR });
    } else if (k === "incidents") {
      setShowList(true);
      setShowUnits(false);
    } else {
      setShowUnits(true);
      setShowList(false);
      setSelectedId(null);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05070a]" data-testid="agency-command-center">
      <Toaster theme="dark" position="top-center" />
      <MapView markers={markers} flyTo={flyTo} />

      <CommandNav
        items={navItems}
        active={showUnits ? "units" : showList ? "incidents" : "map"}
        onSelect={onNav}
        right={
          <>
            <span className="flex items-center gap-1.5 px-2.5 text-[11px] text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 cc-pin-pulse" /> LIVE
            </span>
            <button
              onClick={exit}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              data-testid="agency-exit-button"
            >
              <LogOut size={14} />
            </button>
          </>
        }
      />

      {/* Agency header badge */}
      <div className="absolute top-20 left-4 z-[999] liquid-glass rounded-2xl px-4 py-2.5 flex items-center gap-2.5" data-testid="agency-header">
        <span className="w-2 h-2 rounded-full bg-emerald-400 cc-pin-pulse" />
        <div className="flex flex-col">
          <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">Agency Command · Online</span>
          <span className="text-sm text-white font-medium leading-tight">{agency.name}</span>
        </div>
      </div>

      {/* Incident list */}
      {showList && (
        <div
          className="absolute top-36 left-4 z-[1000] w-[300px] max-h-[60vh] overflow-y-auto cc-scroll liquid-glass-strong rounded-3xl p-4 flex flex-col gap-2 cc-sheet-in"
          data-testid="agency-incident-list"
        >
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 px-1">
            Incidents ({incidents.length})
          </span>
          {incidents.length === 0 && (
            <p className="text-sm text-white/50 px-1 py-4">No active incidents need your team.</p>
          )}
          {incidents.map((inc) => (
            <button
              key={inc.id}
              onClick={() => selectIncident(inc.id)}
              className={`rounded-2xl p-3 flex items-center gap-3 text-left transition-colors ${
                inc.id === selectedId ? "bg-white/12" : "liquid-glass hover:bg-white/10"
              }`}
              data-testid={`agency-incident-item-${inc.id}`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: SEVERITY_COLOR[inc.severity] }}
              />
              <div className="flex flex-col flex-1">
                <span className="text-sm text-white leading-tight">{inc.title}</span>
                <span className="text-[11px] text-white/45">
                  {inc.severity} · {inc.status}
                  {(inc.responses || []).some((r) => r.agencyId === agency.id) && " · accepted"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Right panels */}
      {selectedId && detail && !showUnits && (
        <div className="absolute top-20 right-4 z-[1000] w-[340px] max-w-[calc(100vw-2rem)]">
          <AgencyIncidentPanel
            incident={detail}
            agency={agency}
            accepted={accepted}
            onAccept={accept}
            accepting={accepting}
            recs={recs}
            recsLoading={recsLoading}
            selectedUnits={selectedUnits}
            onToggleUnit={toggleUnit}
            onDispatch={dispatch}
            dispatching={dispatching}
            onClose={() => {
              setSelectedId(null);
              setDetail(null);
            }}
          />
        </div>
      )}

      {showUnits && (
        <div className="absolute top-20 right-4 z-[1000] w-[340px] max-w-[calc(100vw-2rem)]">
          <AgencyUnitsPanel
            units={units}
            onStatusChange={updateUnitStatus}
            onClose={() => setShowUnits(false)}
          />
        </div>
      )}
    </div>
  );
}
