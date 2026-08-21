import { useState } from "react";
import { X, Navigation, Check, Gauge, ChevronDown, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import { incidentLabel, agencyTypeLabel, STATUS_LABEL, SEVERITY_COLOR, km } from "@/lib/command";

const eventTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
  events = [],
  onResolve,
  resolving,
  onClose,
}) {
  const [expandedRec, setExpandedRec] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  const distance = km(
    { lat: agency.latitude, lng: agency.longitude },
    { lat: incident.latitude, lng: incident.longitude }
  ).toFixed(1);
  const myAssignments = (incident.assignments || []).filter(
    (a) => a.unit?.agencyId === agency.id
  );
  const selectedRecs = (recs?.recommendations || []).filter((r) => selectedUnits.includes(r.unitId));
  const canResolve = incident.status === "ON_SCENE" && myAssignments.length > 0;

  const confirmDispatch = () => {
    setReviewing(false);
    onDispatch();
  };

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
        <span className="text-[10px] tracking-[0.2em] uppercase text-white/35">Priority</span>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-medium text-black"
          style={{ background: SEVERITY_COLOR[incident.severity] }}
          data-testid="agency-incident-priority"
        >
          {incident.severity}
        </span>
        <span className="text-white/50 text-xs">{distance} km away</span>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-white/45">
        {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)} ·{" "}
        {STATUS_LABEL[incident.status] || incident.status}
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
                Response dispatched
              </span>
              {myAssignments.map((a) => (
                <div
                  key={a.id}
                  className="liquid-glass rounded-2xl px-4 py-2.5 flex items-center justify-between text-sm"
                  data-testid={`agency-dispatched-${a.unitId}`}
                >
                  <span className="text-white">{a.unit?.name}</span>
                  <span
                    className={`text-xs flex items-center gap-1 ${
                      a.unit?.status === "ON_SCENE" ? "text-amber-300" : "text-sky-300"
                    }`}
                  >
                    {a.unit?.status === "ON_SCENE" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {(a.unit?.status || a.status).replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          )}

          {canResolve && (
            <button
              onClick={onResolve}
              disabled={resolving}
              className="liquid-glass rounded-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-emerald-200 hover:bg-emerald-400/15 transition-colors disabled:opacity-50"
              data-testid="agency-resolve-button"
            >
              <ShieldCheck size={14} />
              {resolving ? "Resolving…" : "Mark resolved"}
            </button>
          )}

          {incident.status !== "RESOLVED" && (
            <>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] tracking-[0.2em] uppercase text-white/40">
                  ResQNet recommendation
                </span>
                <span className="text-[11px] text-white/35">Human approval required before dispatch</span>
              </div>

              {recsLoading && <p className="text-sm text-white/50">Scoring your units…</p>}

              {recs && recs.recommendations.length === 0 && (
                <p className="text-sm text-white/50" data-testid="agency-no-recs">
                  No suitable resource available — all capable units are currently unavailable.
                </p>
              )}

              {!reviewing &&
                recs &&
                recs.recommendations.map((r, i) => {
                  const isSel = selectedUnits.includes(r.unitId);
                  const isExpanded = expandedRec === r.unitId;
                  return (
                    <div
                      key={r.unitId}
                      className={`rounded-2xl transition-colors ${
                        isSel ? "bg-white/12" : "liquid-glass hover:bg-white/8"
                      }`}
                    >
                      <button
                        onClick={() => onToggleUnit(r.unitId)}
                        className="w-full p-4 flex items-start gap-3 text-left"
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
                              <Gauge size={12} /> {r.score}/100
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRec(isExpanded ? null : r.unitId);
                        }}
                        className="w-full flex items-center justify-between px-4 pb-3 text-[11px] text-white/45 hover:text-white/70 transition-colors"
                        data-testid={`agency-rec-why-${r.unitId}`}
                      >
                        Why this resource?
                        <ChevronDown
                          size={13}
                          className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 flex flex-col gap-1.5" data-testid={`agency-rec-reasons-${r.unitId}`}>
                          {r.reasons.map((reason, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[11px] text-white/60">
                              <Check size={11} className="text-emerald-300 shrink-0" />
                              {reason}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

              {!reviewing && recs && recs.recommendations.length > 0 && (
                <button
                  onClick={() => setReviewing(true)}
                  disabled={selectedUnits.length === 0}
                  className="bg-white text-black rounded-full py-3.5 flex items-center justify-center gap-2 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 disabled:opacity-40 disabled:hover:scale-100"
                  data-testid="agency-review-response-button"
                >
                  <Navigation size={14} />
                  Review response ({selectedUnits.length})
                </button>
              )}

              {reviewing && (
                <div className="liquid-glass rounded-2xl p-4 flex flex-col gap-3 cc-sheet-in" data-testid="agency-response-plan">
                  <span className="text-[11px] tracking-[0.2em] uppercase text-white/40">Response plan</span>
                  <div className="flex flex-col gap-1.5">
                    {selectedRecs.map((r) => (
                      <div key={r.unitId} className="flex items-center justify-between text-sm">
                        <span className="text-white">{r.unitName}</span>
                        <span className="text-white/50 text-xs">ETA {r.etaMinutes} min</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReviewing(false)}
                      className="liquid-glass rounded-full px-4 py-3 text-sm hover:bg-white/10 transition-colors"
                      data-testid="agency-response-plan-back"
                    >
                      Back
                    </button>
                    <button
                      onClick={confirmDispatch}
                      disabled={dispatching}
                      className="flex-1 bg-white text-black rounded-full px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 disabled:opacity-50"
                      data-testid="agency-approve-dispatch-button"
                    >
                      {dispatching ? "Dispatching…" : "Approve & dispatch"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {events.length > 0 && (
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={() => setShowTimeline((s) => !s)}
            className="flex items-center justify-between text-[11px] tracking-[0.2em] uppercase text-white/40 hover:text-white/70 transition-colors"
            data-testid="agency-timeline-toggle"
          >
            Timeline
            <ChevronDown size={13} className={`transition-transform duration-200 ${showTimeline ? "rotate-180" : ""}`} />
          </button>
          {showTimeline && (
            <div className="flex flex-col gap-2" data-testid="agency-incident-timeline">
              {events.map((e) => (
                <div key={e.id} className="flex items-start gap-3 text-xs">
                  <span className="text-white/35 shrink-0 pt-0.5 w-11">{eventTime(e.createdAt)}</span>
                  <span className="text-white/65 leading-relaxed">{e.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
