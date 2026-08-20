const STATUSES = ["AVAILABLE", "BUSY", "EN_ROUTE", "ON_SCENE", "OFFLINE", "COMPLETED"];
const EDIT_ROLES = ["ADMIN", "DISPATCHER", "AGENCY_OPERATOR", "FIELD_RESPONDER"];

const DOT = {
  AVAILABLE: "bg-white",
  BUSY: "bg-white/60",
  EN_ROUTE: "bg-white/70",
  ON_SCENE: "bg-white/80",
  OFFLINE: "bg-white/20",
  COMPLETED: "bg-white/40",
};

export default function UnitsPanel({ units, role, onStatusChange }) {
  const canEdit = EDIT_ROLES.includes(role);
  return (
    <div
      className="liquid-glass rounded-3xl p-5 flex flex-col gap-3 max-h-96 overflow-y-auto"
      data-lenis-prevent
      data-testid="units-panel"
    >
      <span className="text-xs tracking-[0.3em] uppercase text-white/50">
        Units ({units.length})
      </span>
      {units.map((unit) => (
        <div
          key={unit.id}
          className="flex items-center gap-3"
          data-testid={`unit-row-${unit.id}`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${DOT[unit.status] || "bg-white/30"}`} />
          <div className="flex-1 flex flex-col">
            <span className="text-xs font-medium text-white">{unit.name}</span>
            <span className="text-[10px] text-white/50">workload {unit.workload}/4</span>
          </div>
          <select
            value={unit.status}
            disabled={!canEdit}
            onChange={(e) => onStatusChange(unit.id, e.target.value)}
            className="bg-white/10 text-white text-[10px] rounded-full px-2 py-1 outline-none disabled:opacity-50 cursor-pointer"
            data-testid={`unit-status-${unit.id}`}
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
  );
}
