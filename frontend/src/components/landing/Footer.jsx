export default function Footer() {
  return (
    <footer className="relative px-6 lg:px-16 pb-12" data-testid="site-footer">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        <div className="h-px w-full bg-white/10" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <a
            href="/"
            className="flex items-center gap-3 hover:scale-105 transition-transform duration-300"
            data-testid="footer-logo"
          >
            <img src="/logo.png" alt="ResQNet logo" className="w-7 h-7" />
            <span className="text-xl font-semibold tracking-tighter text-white">
              resqnet
            </span>
          </a>
          <p className="text-xs tracking-[0.2em] uppercase text-white/50">
            Simulated demonstration environment — Nagpur
          </p>
          <p className="text-xs text-white/40">© 2026 ResQNet</p>
        </div>
      </div>
    </footer>
  );
}
