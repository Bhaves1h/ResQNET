import { X, Navigation, Check, Gauge } from "lucide-react";
import { incidentLabel, agencyTypeLabel, SEVERITY_COLOR, km } from "@/lib/command";

export default function AgencyIncidentPanel({
  incident,
  agency,
  accepted,
  onAccept,
  accepting,
  recs,
  recsLoading,
  selectedUnits,
  onToggleUnit,
  onDispatch,
  dispatching,
  onClose,
}) {
  const distance = km(
    { lat: agency.latitude, lng: agency.longitude },
    { lat: incident.latitude, lng: incident.longitude }
  ).toFixed(1);
  const myAssignments = (incident.assignments || []).filter(
    (a) => a.unit?.agencyId === agency.id
  );

  return (
    <div
      className="liquid-glass-strong rounded-3xl p-6 flex flex-col gap-4 max-h-[calc(100vh-7rem)] overflow-y-auto cc-scroll cc-sheet-in"
      data-testid="agency-incident-panel"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] tracking-[0.25em] uppercase text-white/40">
            {incident.id}
          </span>
          <h3 className="text-xl font-medium tracking-tight">{incidentLabel(incident.type)}</h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          data-testid="agency-incident-close"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-medium text-black"
          style={{ background: SEVERITY_COLOR[incident.severity] }}
        >
          {incident.severity}
        </span>
        <span className="text-white/50 text-xs">{distance} km away</span>
      </div>

      {incident.description && (
        <p className="text-sm text-white/60 leading-relaxed">{incident.description}</p>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] tracking-[0.2em] uppercase text-white/40">Requesting</span>
        <div className="flex flex-wrap gap-1.5">
          {(incident.requestedAgencies || []).map((t) => (
            <span key={t} className="liquid-glass rounded-full px-3 py-1 text-xs text-white/80">
              {agencyTypeLabel(t)}
            </span>
          ))}
        </div>
      </div>

      {!accepted ? (
        <button
          onClick={onAccept}
          disabled={accepting}
          className="bg-white text-black rounded-full py-3.5 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 disabled:opacity-50"
          data-testid="agency-accept-button"
        >
          {accepting ? "Accepting…" : "Accept response"}
        </button>
      ) : (
        <>
          <div className="rounded-2xl bg-emerald-400/15 text-emerald-200 text-sm px-4 py-2.5 flex items-center gap-2" data-testid="agency-accepted-banner">
            <Check size={14} /> Response accepted
          </div>

          {myAssignments.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] tracking-[0.2em] uppercase text-white/40">
                Dispatched
              </span>
              {myAssignments.map((a) => (
                <div
                  key={a.id}
                  className="liquid-glass rounded-2xl px-4 py-2.5 flex items-center justify-between text-sm"
                  data-testid={`agency-dispatched-${a.unitId}`}
                >
                  <span className="text-white">{a.unit?.name}</span>
                  <span className="text-xs text-white/60">{a.status.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[11px] tracking-[0.2em] uppercase text-white/40">
              Recommended units
            </span>
          </div>

          {recsLoading && <p className="text-sm text-white/50">Scoring your units…</p>}

          {recs && recs.recommendations.length === 0 && (
            <p className="text-sm text-white/50" data-testid="agency-no-recs">
              No eligible units available in your agency for this incident.
            </p>
          )}

          {recs &&
            recs.recommendations.map((r, i) => {
              const isSel = selectedUnits.includes(r.unitId);
              return (
                <button
                  key={r.unitId}
                  onClick={() => onToggleUnit(r.unitId)}
                  className={`rounded-2xl p-4 flex items-start gap-3 text-left transition-colors ${
                    isSel ? "bg-white/12" : "liquid-glass hover:bg-white/8"
                  }`}
                  data-testid={`agency-rec-${r.unitId}`}
                >
                  <span
                    className={`w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center ${
                      isSel ? "bg-white text-black" : "bg-white/10 text-transparent"
                    }`}
                  >
                    <Check size={12} />
                  </span>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{r.unitName}</span>
                      <span className="flex items-center gap-1 text-xs text-white/70">
                        <Gauge size={12} /> {r.score}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/50">
                      {r.distanceKm} km · ETA {r.etaMinutes} min · workload {r.workload}/4
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {i === 0 && (
                        <span className="text-[10px] rounded-full bg-emerald-400/20 text-emerald-200 px-2 py-0.5">
                          Best match
                        </span>
                      )}
                      {r.matchedCapabilities.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] rounded-full bg-white/10 text-white/60 px-2 py-0.5"
                        >
                          {c.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}

          {recs && recs.recommendations.length > 0 && (
            <button
              onClick={onDispatch}
              disabled={selectedUnits.length === 0 || dispatching}
              className="bg-white text-black rounded-full py-3.5 flex items-center justify-center gap-2 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 disabled:opacity-40 disabled:hover:scale-100"
              data-testid="agency-dispatch-button"
            >
              <Navigation size={14} />
              {dispatching ? "Dispatching…" : `Dispatch selected (${selectedUnits.length})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
