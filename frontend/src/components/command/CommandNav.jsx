import { useNavigate } from "react-router-dom";

export default function CommandNav({ items = [], active, onSelect, right }) {
  const navigate = useNavigate();
  return (
    <nav
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] liquid-glass-strong rounded-full pl-2 pr-2 py-1.5 flex items-center gap-1 shadow-2xl"
      data-testid="command-nav"
    >
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 pl-2 pr-2 py-1.5 rounded-full hover:bg-white/10 transition-colors duration-200"
        data-testid="command-nav-home"
      >
        <img src="/logo.png" alt="ResQNet" className="w-5 h-5" />
        <span className="text-[13px] font-semibold tracking-tight text-white hidden sm:inline">
          ResQNET
        </span>
      </button>
      <span className="w-px h-5 bg-white/15 mx-0.5" />
      {items.map((it) => {
        const Icon = it.icon;
        const isActive = active === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onSelect(it.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] transition-all duration-200 ${
              isActive
                ? "bg-white text-black"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
            data-testid={`command-nav-${it.key}`}
          >
            <Icon size={14} />
            <span className="hidden md:inline">{it.label}</span>
          </button>
        );
      })}
      {right && (
        <>
          <span className="w-px h-5 bg-white/15 mx-0.5" />
          {right}
        </>
      )}
    </nav>
  );
}
