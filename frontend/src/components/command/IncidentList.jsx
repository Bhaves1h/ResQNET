const SEVERITY_STYLES = {
  CRITICAL: "bg-white text-black",
  HIGH: "bg-white/70 text-black",
  MODERATE: "bg-white/30 text-white",
  LOW: "bg-white/15 text-white/70",
};

export default function IncidentList({ incidents, selectedId, onSelect }) {
  return (
    <div
      className="flex flex-col gap-3 overflow-y-auto pr-1"
      data-lenis-prevent
      data-testid="incident-list"
    >
      {incidents.map((incident) => (
        <button
          key={incident.id}
          onClick={() => onSelect(incident.id)}
          className={`liquid-glass rounded-2xl p-4 text-left flex flex-col gap-2 transition-transform duration-300 hover:scale-[1.02] ${
            selectedId === incident.id ? "bg-white/10" : ""
          }`}
          data-testid={`incident-card-${incident.id}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-white/50">{incident.id}</span>
            <span
              className={`text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full ${SEVERITY_STYLES[incident.severity] || ""}`}
            >
              {incident.severity}
            </span>
          </div>
          <span className="text-sm font-medium text-white leading-snug">
            {incident.title}
          </span>
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>{incident.type.replace(/_/g, " ")}</span>
            <span>{incident.status.replace(/_/g, " ")}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
