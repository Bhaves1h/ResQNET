import { ArrowRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative px-6 lg:px-16 pb-12" id="network" data-testid="site-footer">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        <div className="flex flex-col items-center gap-6 py-14">
          <span className="text-xs tracking-[0.3em] uppercase text-white/50">
            Ready to coordinate?
          </span>
          <a
            href="/command"
            className="liquid-glass-strong rounded-full px-10 py-4 flex items-center gap-3 text-sm font-medium text-white hover:scale-105 active:scale-95 transition-transform duration-300"
            data-testid="enter-command-center-button"
          >
            Enter Command Center
            <ArrowRight size={15} />
          </a>
        </div>
        <div className="h-px w-full bg-white/10" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <a
            href="/"
            className="flex items-center gap-3 hover:scale-105 transition-transform duration-300"
            data-testid="footer-logo"
          >
            <img src="/logo.png" alt="ResQNET logo" className="w-7 h-7" />
            <span className="text-xl font-semibold tracking-tighter text-white">
              ResQNET
            </span>
          </a>
          <p className="text-xs tracking-[0.2em] uppercase text-white/50">
            Simulated demonstration environment — Nagpur
          </p>
          <p className="text-xs text-white/40">© 2026 ResQNET</p>
        </div>
      </div>
    </footer>
  );
}
