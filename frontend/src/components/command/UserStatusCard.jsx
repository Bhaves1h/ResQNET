import { X, MapPin } from "lucide-react";
import { incidentLabel, agencyTypeLabel, STATUS_LABEL, SEVERITY_COLOR, km, computeEnRoute } from "@/lib/command";

const unitEta = (unit, incident) => {
  if (!unit) return null;
  const d = km(
    { lat: unit.latitude, lng: unit.longitude },
    { lat: incident.latitude, lng: incident.longitude }
  );
  return Math.max(1, Math.round((d / 30) * 60));
};

export default function UserStatusCard({ incident, onClose }) {
  const responses = incident.responses || [];
  const assignments = incident.assignments || [];
  const confirmed = responses.length > 0 || assignments.length > 0;

  return (
    <div
      className="liquid-glass-strong rounded-3xl p-6 flex flex-col gap-5 cc-sheet-in"
      data-testid="user-status-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] tracking-[0.25em] uppercase text-white/40">
            Your incident
          </span>
          <h3 className="text-xl font-medium tracking-tight flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: SEVERITY_COLOR[incident.severity] }}
            />
            {incidentLabel(incident.type)}
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            data-testid="user-status-close"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div
        className={`rounded-2xl px-4 py-3 flex items-center gap-2.5 text-sm ${
          confirmed ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200"
        }`}
        data-testid="user-status-state"
      >
        <span className="w-2 h-2 rounded-full bg-current cc-pin-pulse" />
        {confirmed ? "Response confirmed" : "Response requested"}
      </div>

      <div className="flex items-center gap-2 text-xs text-white/55">
        <MapPin size={13} />
        {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)} · {incident.id}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] tracking-[0.2em] uppercase text-white/40">Requested</span>
        <div className="flex flex-col gap-1.5">
          {(incident.requestedAgencies || []).map((t) => {
            const res = responses.find((r) => r.agencyType === t);
            return (
              <div
                key={t}
                className="flex items-center justify-between text-sm"
                data-testid={`user-requested-${t}`}
              >
                <span className="text-white/80">{agencyTypeLabel(t)}</span>
                <span className={res ? "text-emerald-300 text-xs" : "text-white/40 text-xs"}>
                  {res ? "Responding" : "Awaiting"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {assignments.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/40">
            Units dispatched
          </span>
          {assignments.map((a) => (
            <div
              key={a.id}
              className="liquid-glass rounded-2xl px-4 py-3 flex items-center justify-between"
              data-testid={`user-unit-${a.unitId}`}
            >
              <div className="flex flex-col">
                <span className="text-sm text-white">{a.unit?.name || a.unitId}</span>
                <span className="text-[11px] text-white/50">
                  {(a.unit?.status || a.status).replace(/_/g, " ")}
                </span>
              </div>
              {a.unit?.status === "EN_ROUTE" && (
                <span className="text-xs text-white/70">
                  ETA {computeEnRoute(a, a.unit, incident)?.etaMinutes ?? unitEta(a.unit, incident)} min
                </span>
              )}
              {a.status === "DISPATCHED" && a.unit?.status !== "EN_ROUTE" && a.unit && (
                <span className="text-xs text-white/70">ETA {unitEta(a.unit, incident)} min</span>
              )}
              {a.unit?.status === "ON_SCENE" && (
                <span className="text-xs text-emerald-300">On scene</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 text-[11px] text-white/40">
        <span className="w-6 h-px bg-white/20" />
        Status: {STATUS_LABEL[incident.status] || incident.status}
      </div>
    </div>
  );
}
