import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function ScrollHint() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 260;
      setHidden(nearBottom);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-500 ${
        hidden ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100"
      }`}
      data-testid="scroll-hint"
    >
      <div className="liquid-glass-strong rounded-full pl-5 pr-4 py-3 flex items-center gap-2.5 text-[13px] text-white/85">
        <span>Scroll down to enter the Command Center</span>
        <ChevronDown size={15} className="animate-bounce" />
      </div>
    </div>
  );
}
