import { Check, Navigation } from "lucide-react";

export default function RecommendationPanel({
  incident,
  data,
  loading,
  selected,
  onToggle,
  onDispatch,
  onGenerate,
  dispatching,
}) {
  if (!incident) {
    return (
      <div
        className="liquid-glass rounded-3xl flex-1 flex items-center justify-center text-white/50 text-sm"
        data-testid="recommendations-empty"
      >
        Select an incident to generate a recommended response
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" data-testid="recommendations-panel">
      <div className="liquid-glass rounded-3xl p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-white tracking-tight">
            {incident.title}
          </h2>
          <span className="text-xs text-white/50">{incident.id}</span>
        </div>
        <p className="text-sm text-white/60 leading-relaxed">{incident.description}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {incident.requiredCapabilities.map((cap) => (
            <span
              key={cap}
              className="liquid-glass rounded-full px-3 py-1 text-xs text-white/80"
              data-testid={`required-cap-${cap}`}
            >
              {cap.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      </div>

      {!data && (
        <button
          onClick={onGenerate}
          disabled={loading}
          className="liquid-glass-strong rounded-full px-6 py-3 text-sm font-medium text-white hover:scale-105 active:scale-95 transition-transform duration-300 w-fit disabled:opacity-50"
          data-testid="generate-recommendations-button"
        >
          {loading ? "Scoring units…" : "Generate Recommendations"}
        </button>
      )}

      {data && (
        <>
          <span className="text-xs tracking-[0.3em] uppercase text-white/50">
            Recommended Response
          </span>
          <div className="flex flex-col gap-3">
            {data.recommendations.map((rec, i) => {
              const isSelected = selected.includes(rec.unitId);
              return (
                <div
                  key={rec.unitId}
                  className={`liquid-glass rounded-2xl p-4 flex items-center gap-4 transition-transform duration-300 hover:scale-[1.01] ${
                    isSelected ? "bg-white/10" : ""
                  }`}
                  data-testid={`rec-card-${rec.unitId}`}
                >
                  <button
                    onClick={() => onToggle(rec.unitId)}
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center transition-colors duration-200 ${
                      isSelected ? "bg-white text-black" : "bg-white/10 text-transparent"
                    }`}
                    data-testid={`rec-toggle-${rec.unitId}`}
                  >
                    <Check size={13} />
                  </button>
                  <span className="text-lg font-medium text-white/30 w-6">{i + 1}</span>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-sm font-medium text-white">{rec.unitName}</span>
                    <span className="text-xs text-white/60">
                      {rec.distanceKm} km · ETA {rec.etaMinutes} min · workload {rec.workload}/4
                    </span>
                    <span className="text-xs text-white/50">
                      {rec.matchedCapabilities.join(", ").replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-medium text-white">{rec.score}</span>
                    <span className="text-[10px] tracking-widest uppercase text-white/50">
                      score
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {data.recommendations.length === 0 && (
            <p className="text-sm text-white/60" data-testid="no-recommendations">
              No eligible units — all candidates were excluded by capability or availability filters.
            </p>
          )}
          <button
            onClick={onDispatch}
            disabled={selected.length === 0 || dispatching}
            className="liquid-glass-strong rounded-full px-6 py-3.5 flex items-center justify-center gap-3 text-sm font-medium text-white hover:scale-105 active:scale-95 transition-transform duration-300 disabled:opacity-40 disabled:hover:scale-100"
            data-testid="dispatch-button"
          >
            <Navigation size={14} />
            {dispatching ? "Validating & dispatching…" : `Dispatch Response (${selected.length})`}
          </button>
        </>
      )}
    </div>
  );
}
