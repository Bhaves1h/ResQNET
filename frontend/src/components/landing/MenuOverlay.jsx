import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

const LINKS = [
  { n: "01", label: "Home", href: "/", id: "menu-link-home" },
  { n: "02", label: "Manifesto", href: "/#manifesto", id: "menu-link-manifesto" },
  { n: "03", label: "Command Center", href: "/command", id: "menu-link-command" },
  { n: "04", label: "Network", href: "/#network", id: "menu-link-network" },
];

export default function MenuOverlay() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="liquid-glass rounded-full px-5 py-2.5 flex items-center gap-2 text-sm text-white/80 hover:scale-105 active:scale-95 transition-transform duration-300"
        data-testid="menu-button"
        onClick={() => setOpen(true)}
      >
        <Menu size={15} />
        <span>Menu</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-2xl flex flex-col"
            data-testid="menu-overlay"
          >
            <div className="flex items-center justify-between px-8 py-8 lg:px-14">
              <span className="text-2xl font-semibold tracking-tighter text-white">
                resqnet
              </span>
              <button
                onClick={() => setOpen(false)}
                className="liquid-glass w-11 h-11 rounded-full flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform duration-300"
                data-testid="menu-close-button"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 flex flex-col justify-center px-8 lg:px-24 gap-2">
              {LINKS.map((link, i) => (
                <motion.a
                  key={link.id}
                  href={link.href}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setOpen(false)}
                  className="group flex items-baseline gap-6 py-4 w-fit"
                  data-testid={link.id}
                >
                  <span className="text-sm text-white/40 font-medium">{link.n}</span>
                  <span className="text-4xl lg:text-6xl font-medium tracking-[-0.04em] text-white/70 group-hover:text-white group-hover:translate-x-3 transition-all duration-300">
                    {link.label}
                  </span>
                </motion.a>
              ))}
            </nav>
            <div className="px-8 lg:px-24 pb-10">
              <p className="text-xs tracking-[0.3em] uppercase text-white/40">
                Unified disaster response coordination — Nagpur demo
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
