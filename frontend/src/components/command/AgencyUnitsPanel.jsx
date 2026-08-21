import { X } from "lucide-react";

const STATUSES = ["AVAILABLE", "EN_ROUTE", "ON_SCENE", "COMPLETED"];
const DOT = {
  AVAILABLE: "#4ade80",
  BUSY: "#facc15",
  EN_ROUTE: "#5aa9ff",
  ON_SCENE: "#ffce4d",
  OFFLINE: "#6b7280",
  COMPLETED: "#a1a1aa",
};

export default function AgencyUnitsPanel({ units, onStatusChange, onClose }) {
  const counts = units.reduce((acc, u) => {
    acc[u.status] = (acc[u.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div
      className="liquid-glass-strong rounded-3xl p-6 flex flex-col gap-4 max-h-[calc(100vh-7rem)] overflow-y-auto cc-scroll cc-sheet-in"
      data-testid="agency-units-panel"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] tracking-[0.25em] uppercase text-white/40">My units</span>
          <h3 className="text-xl font-medium tracking-tight">{units.length} units</h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          data-testid="agency-units-close"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {["AVAILABLE", "EN_ROUTE", "ON_SCENE"].map((s) => (
          <span key={s} className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/70">
            {counts[s] || 0} {s.replace(/_/g, " ").toLowerCase()}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {units.map((u) => (
          <div
            key={u.id}
            className="liquid-glass rounded-2xl p-3.5 flex items-center gap-3"
            data-testid={`agency-unit-${u.id}`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: DOT[u.status] || "#888" }}
            />
            <div className="flex-1 flex flex-col">
              <span className="text-sm text-white">{u.name}</span>
              <span className="text-[11px] text-white/45">
                {(u.capabilities || []).slice(0, 3).join(", ").replace(/_/g, " ")}
              </span>
            </div>
            <select
              value={STATUSES.includes(u.status) ? u.status : "AVAILABLE"}
              onChange={(e) => onStatusChange(u.id, e.target.value)}
              className="bg-white/10 text-white text-[11px] rounded-full px-2.5 py-1.5 outline-none cursor-pointer"
              data-testid={`agency-unit-status-${u.id}`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="bg-neutral-900">
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
