import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import IncidentList from "@/components/command/IncidentList";
import RecommendationPanel from "@/components/command/RecommendationPanel";
import Timeline from "@/components/command/Timeline";
import UnitsPanel from "@/components/command/UnitsPanel";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ROLES = ["DISPATCHER", "AGENCY_OPERATOR", "FIELD_RESPONDER", "ADMIN"];

export default function CommandCenter() {
  const [role, setRole] = useState(
    () => localStorage.getItem("resqnet_role") || "DISPATCHER"
  );
  const [incidents, setIncidents] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [incident, setIncident] = useState(null);
  const [events, setEvents] = useState([]);
  const [recs, setRecs] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [dispatching, setDispatching] = useState(false);

  const headers = { "X-Role": role };

  const fetchBase = useCallback(async () => {
    try {
      const [incRes, unitRes] = await Promise.all([
        axios.get(`${API}/incidents`),
        axios.get(`${API}/units`),
      ]);
      setIncidents(incRes.data);
      setUnits(unitRes.data);
    } catch {
      toast.error("Could not reach the ResQNet API");
    }
  }, []);

  const fetchIncidentDetail = useCallback(async (id) => {
    const [detailRes, eventRes] = await Promise.all([
      axios.get(`${API}/incidents/${id}`),
      axios.get(`${API}/incidents/${id}/events`),
    ]);
    setIncident(detailRes.data);
    setEvents(eventRes.data.slice(-12).reverse());
  }, []);

  useEffect(() => {
    fetchBase();
    const interval = setInterval(fetchBase, 10000);
    return () => clearInterval(interval);
  }, [fetchBase]);

  useEffect(() => {
    if (!selectedId) return;
    setRecs(null);
    setSelectedUnits([]);
    fetchIncidentDetail(selectedId).catch(() => toast.error("Failed to load incident"));
  }, [selectedId, fetchIncidentDetail]);

  const changeRole = (r) => {
    setRole(r);
    localStorage.setItem("resqnet_role", r);
  };

  const generateRecs = async () => {
    setRecsLoading(true);
    try {
      const res = await axios.get(`${API}/incidents/${selectedId}/recommendations`);
      setRecs(res.data);
      setSelectedUnits(res.data.recommendations.slice(0, 3).map((r) => r.unitId));
      fetchIncidentDetail(selectedId);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Recommendation failed");
    } finally {
      setRecsLoading(false);
    }
  };

  const toggleUnit = (unitId) =>
    setSelectedUnits((prev) =>
      prev.includes(unitId) ? prev.filter((u) => u !== unitId) : [...prev, unitId]
    );

  const dispatch = async () => {
    setDispatching(true);
    try {
      await axios.post(
        `${API}/incidents/${selectedId}/dispatch`,
        { unitIds: selectedUnits },
        { headers }
      );
      toast.success(`Dispatched ${selectedUnits.length} unit(s) — now EN ROUTE`);
      setRecs(null);
      setSelectedUnits([]);
      await fetchBase();
      await fetchIncidentDetail(selectedId);
    } catch (err) {
      const error = err.response?.data?.error;
      toast.error(error?.message || "Dispatch failed");
    } finally {
      setDispatching(false);
    }
  };

  const updateUnitStatus = async (unitId, status) => {
    try {
      await axios.patch(`${API}/units/${unitId}/status`, { status }, { headers });
      toast.success(`Unit status → ${status.replace(/_/g, " ")}`);
      await fetchBase();
      if (selectedId) fetchIncidentDetail(selectedId);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Status update failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white font-sans" data-testid="command-center">
      <Toaster theme="dark" position="top-right" />
      <header className="flex items-center justify-between px-6 lg:px-10 py-5">
        <a href="/" className="flex items-center gap-3 hover:scale-105 transition-transform duration-300" data-testid="command-brand">
          <img src="/logo.png" alt="ResQNet" className="w-7 h-7" />
          <span className="text-xl font-semibold tracking-tighter">resqnet</span>
          <span className="text-xs tracking-[0.3em] uppercase text-white/50 ml-2 hidden sm:inline">
            Command Center
          </span>
        </a>
        <div className="liquid-glass rounded-full p-1 flex items-center gap-1" data-testid="role-switcher">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => changeRole(r)}
              className={`px-3 py-1.5 rounded-full text-[10px] tracking-wider transition-colors duration-200 ${
                role === r ? "bg-white text-black" : "text-white/60 hover:text-white"
              }`}
              data-testid={`role-button-${r.toLowerCase()}`}
            >
              {r.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-[320px_1fr_360px] gap-6 px-6 lg:px-10 pb-10 lg:h-[calc(100vh-92px)]">
        <section className="flex flex-col gap-4 min-h-0">
          <span className="text-xs tracking-[0.3em] uppercase text-white/50">
            Incidents ({incidents.length})
          </span>
          <IncidentList incidents={incidents} selectedId={selectedId} onSelect={setSelectedId} />
        </section>

        <section className="min-h-0 overflow-y-auto pr-1" data-lenis-prevent>
          <RecommendationPanel
            incident={incident}
            data={recs}
            loading={recsLoading}
            selected={selectedUnits}
            onToggle={toggleUnit}
            onDispatch={dispatch}
            onGenerate={generateRecs}
            dispatching={dispatching}
          />
        </section>

        <section className="flex flex-col gap-4 min-h-0">
          <Timeline events={events} />
          <UnitsPanel units={units} role={role} onStatusChange={updateUnitStatus} />
        </section>
      </main>
    </div>
  );
}
