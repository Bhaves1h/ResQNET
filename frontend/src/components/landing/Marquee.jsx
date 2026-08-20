const ITEMS = [
  "Multi-Agency Coordination",
  "Rapid Response Tactics",
  "Unified Command Center",
  "Real-Time Data Sync",
];

export default function Marquee() {
  return (
    <section
      className="relative py-24 overflow-hidden"
      data-testid="marquee-section"
    >
      <div className="h-px w-full bg-white/10 mb-16" />
      <div className="flex whitespace-nowrap animate-marquee" data-testid="marquee-track">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center">
            {ITEMS.map((item) => (
              <span key={`${half}-${item}`} className="flex items-center">
                <span className="text-sm md:text-base tracking-[0.35em] uppercase text-white/50 px-10">
                  {item}
                </span>
                <span className="text-white/25 text-xs tracking-widest">//</span>
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="h-px w-full bg-white/10 mt-16" />
    </section>
  );
}
