import { useState } from "react";
import { X, MapPin, Crosshair, ArrowRight, ArrowLeft, Check } from "lucide-react";
import {
  INCIDENT_TYPES,
  AGENCY_TYPES,
  incidentLabel,
  agencyTypeLabel,
} from "@/lib/command";

export default function AddIncidentSheet({
  draft,
  setDraft,
  minimized,
  onUseLocation,
  onSelectOnMap,
  onSubmit,
  submitting,
  locating,
  onClose,
}) {
  const [step, setStep] = useState(1);

  if (minimized) {
    return (
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1100] liquid-glass-strong rounded-full px-5 py-3 flex items-center gap-2 text-sm cc-sheet-in"
        data-testid="add-incident-map-hint"
      >
        <MapPin size={15} />
        Tap anywhere on the map to set the incident location
      </div>
    );
  }

  const hasLocation = draft.lat != null && draft.lng != null;
  const toggleAgency = (key) =>
    setDraft((d) => ({
      ...d,
      agencies: d.agencies.includes(key)
        ? d.agencies.filter((a) => a !== key)
        : [...d.agencies, key],
    }));

  const canNext =
    (step === 1 && draft.type) ||
    (step === 2 && hasLocation) ||
    (step === 3 && draft.agencies.length > 0);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[1100] flex justify-center px-4 pb-4 sm:pb-6 pointer-events-none"
      data-testid="add-incident-sheet"
    >
      <div className="liquid-glass-strong rounded-3xl w-full max-w-md p-6 flex flex-col gap-5 pointer-events-auto cc-sheet-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`h-1 rounded-full transition-all duration-300 ${
                  s === step ? "w-6 bg-white" : "w-3 bg-white/25"
                }`}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            data-testid="add-incident-close"
          >
            <X size={15} />
          </button>
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-medium tracking-tight">What's happening?</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {INCIDENT_TYPES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setDraft((d) => ({ ...d, type: key }))}
                  className={`rounded-2xl p-4 flex flex-col items-start gap-2 transition-all duration-200 ${
                    draft.type === key
                      ? "bg-white text-black"
                      : "liquid-glass text-white hover:bg-white/10"
                  }`}
                  data-testid={`incident-type-${key}`}
                >
                  <Icon size={18} />
                  <span className="text-xs font-medium text-left leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-medium tracking-tight">Where do you need help?</h3>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={onUseLocation}
                disabled={locating}
                className="liquid-glass rounded-2xl px-4 py-3.5 flex items-center gap-3 text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
                data-testid="incident-use-location"
              >
                <Crosshair size={16} />
                {locating ? "Getting your location…" : "Use my location"}
              </button>
              <button
                onClick={onSelectOnMap}
                className="liquid-glass rounded-2xl px-4 py-3.5 flex items-center gap-3 text-sm hover:bg-white/10 transition-colors"
                data-testid="incident-select-on-map"
              >
                <MapPin size={16} />
                Select on map
              </button>
            </div>
            {hasLocation && (
              <div
                className="flex items-center gap-2 text-xs text-white/70 bg-white/10 rounded-xl px-3 py-2.5"
                data-testid="incident-location-set"
              >
                <Check size={14} /> Incident location selected ({draft.lat.toFixed(4)},{" "}
                {draft.lng.toFixed(4)})
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-medium tracking-tight">Who do you need?</h3>
            <div className="flex flex-wrap gap-2">
              {AGENCY_TYPES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => toggleAgency(key)}
                  className={`rounded-full px-3.5 py-2 flex items-center gap-2 text-xs transition-all duration-200 ${
                    draft.agencies.includes(key)
                      ? "bg-white text-black"
                      : "liquid-glass text-white hover:bg-white/10"
                  }`}
                  data-testid={`agency-chip-${key}`}
                >
                  <Icon size={13} />
                  {label}
                  {draft.agencies.includes(key) && <Check size={12} />}
                </button>
              ))}
            </div>
            <textarea
              placeholder="What should responders know? (optional)"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              rows={2}
              className="bg-white/5 rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-white/40 resize-none"
              data-testid="incident-description"
            />
            {draft.type && draft.agencies.length > 0 && (
              <div className="text-xs text-white/60 leading-relaxed bg-white/5 rounded-2xl px-4 py-3">
                <span className="text-white font-medium">{incidentLabel(draft.type)}</span> ·{" "}
                {draft.agencies.map(agencyTypeLabel).join(" + ")}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="liquid-glass rounded-full px-4 py-3 flex items-center gap-2 text-sm hover:bg-white/10 transition-colors"
              data-testid="add-incident-back"
            >
              <ArrowLeft size={15} />
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="flex-1 bg-white text-black rounded-full px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 disabled:opacity-40 disabled:hover:scale-100"
              data-testid="add-incident-next"
            >
              Continue <ArrowRight size={15} />
            </button>
          ) : (
            <button
              onClick={onSubmit}
              disabled={!canNext || submitting}
              className="flex-1 bg-white text-black rounded-full px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 disabled:opacity-40 disabled:hover:scale-100"
              data-testid="report-incident-button"
            >
              {submitting ? "Reporting…" : "Report incident"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
