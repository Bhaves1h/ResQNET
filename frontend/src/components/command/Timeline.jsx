export default function Timeline({ events }) {
  return (
    <div
      className="liquid-glass rounded-3xl p-5 flex flex-col gap-4 max-h-72 overflow-y-auto"
      data-lenis-prevent
      data-testid="incident-timeline"
    >
      <span className="text-xs tracking-[0.3em] uppercase text-white/50">Timeline</span>
      {events.length === 0 && (
        <span className="text-xs text-white/40">No events yet</span>
      )}
      <div className="flex flex-col gap-3">
        {events.map((event) => (
          <div key={event.id} className="flex gap-3" data-testid={`event-${event.id}`}>
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] tracking-widest uppercase text-white/40">
                {event.type.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-white/80 leading-snug">
                {event.description}
              </span>
              <span className="text-[10px] text-white/40">
                {new Date(event.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
