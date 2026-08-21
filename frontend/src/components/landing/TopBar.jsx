import { ArrowUpRight } from "lucide-react";

const LINKS = [
  { label: "Home", href: "/", id: "top-link-home" },
  { label: "Manifesto", href: "/#manifesto", id: "top-link-manifesto" },
  { label: "Network", href: "/#network", id: "top-link-network" },
];

export default function TopBar() {
  return (
    <nav
      className="fixed top-4 left-1/2 -translate-x-1/2 z-40 liquid-glass-strong rounded-full pl-2 pr-2 py-1.5 flex items-center gap-1 shadow-2xl"
      data-testid="top-bar"
    >
      <a
        href="/"
        className="flex items-center gap-2 pl-2 pr-2 py-1.5 rounded-full hover:bg-white/10 transition-colors duration-200"
        data-testid="top-bar-logo"
      >
        <img src="/logo.png" alt="ResQNET" className="w-5 h-5" />
        <span className="text-[13px] font-semibold tracking-tight text-white hidden sm:inline">
          ResQNET
        </span>
      </a>
      <span className="w-px h-5 bg-white/15 mx-0.5" />
      {LINKS.map((link) => (
        <a
          key={link.id}
          href={link.href}
          className="px-3 py-1.5 rounded-full text-[12px] text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
          data-testid={link.id}
        >
          {link.label}
        </a>
      ))}
      <span className="w-px h-5 bg-white/15 mx-0.5" />
      <a
        href="/command"
        className="flex items-center gap-1.5 pl-3.5 pr-3 py-1.5 rounded-full bg-white text-black text-[12px] font-medium hover:scale-[1.03] active:scale-95 transition-transform duration-200"
        data-testid="top-link-command"
      >
        Command Center
        <ArrowUpRight size={13} />
      </a>
    </nav>
  );
}
