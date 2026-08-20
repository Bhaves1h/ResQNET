import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Twitter,
  Linkedin,
  Instagram,
  Sparkles,
  Wand2,
  BookOpen,
  Plus,
  Download,
} from "lucide-react";
import MenuOverlay from "@/components/landing/MenuOverlay";

const EASE = [0.22, 1, 0.36, 1];

const THUMB_URL =
  "https://images.unsplash.com/photo-1549569485-1b0c5bf30005?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHw0fHxyZXNjdWUlMjBjb29yZGluYXRpb258ZW58MHx8fGJsYWNrX2FuZF93aGl0ZXwxNzg3MjE1OTczfDA&ixlib=rb-4.1.0&q=85";

const fadeUp = (delay) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.9, ease: EASE },
});

const MaskedLine = ({ children, delay }) => (
  <span className="block overflow-hidden pb-2 -mb-2">
    <motion.span
      className="block"
      initial={{ y: "115%" }}
      animate={{ y: "0%" }}
      transition={{ delay, duration: 1, ease: EASE }}
    >
      {children}
    </motion.span>
  </span>
);

const PILLS = [
  { label: "Live Incident Map", id: "live-incident-map" },
  { label: "Smart Dispatch", id: "smart-dispatch" },
  { label: "Unified Command", id: "unified-command" },
];

const SOCIALS = [
  { icon: Twitter, id: "social-twitter" },
  { icon: Linkedin, id: "social-linkedin" },
  { icon: Instagram, id: "social-instagram" },
];

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yCommunity = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const yFeatures = useTransform(scrollYProgress, [0, 1], [0, -110]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen w-full flex flex-col lg:flex-row"
      data-testid="hero-section"
    >
      {/* LEFT PANEL */}
      <div className="relative w-full lg:w-[52%] min-h-screen flex">
        <div
          className="liquid-glass-strong absolute inset-4 lg:inset-6 rounded-3xl"
          data-testid="hero-glass-panel"
        />
        <div className="relative z-10 flex flex-col flex-1 justify-between px-8 py-8 lg:px-14 lg:py-12">
          <motion.nav
            {...fadeUp(0.1)}
            className="flex items-center justify-between"
            data-testid="hero-nav"
          >
            <a
              href="/"
              className="flex items-center gap-3 hover:scale-105 transition-transform duration-300"
              data-testid="brand-logo"
            >
              <img src="/logo.png" alt="ResQNet logo" className="w-8 h-8" />
              <span className="text-2xl font-semibold tracking-tighter text-white">
                resqnet
              </span>
            </a>
            <MenuOverlay />
          </motion.nav>

          <div className="flex flex-col items-start gap-8 py-14">
            <motion.img
              {...fadeUp(0.25)}
              src="/logo.png"
              alt="ResQNet mark"
              className="w-20 h-20"
              data-testid="hero-logo-large"
            />
            <h1
              className="text-6xl lg:text-7xl font-medium tracking-[-0.05em] leading-[1.04] text-white"
              data-testid="hero-heading"
            >
              <MaskedLine delay={0.35}>Uniting the</MaskedLine>
              <MaskedLine delay={0.48}>
                <em className="font-serif italic font-normal text-white/80">
                  spirit of response
                </em>
              </MaskedLine>
            </h1>
            <motion.button
              {...fadeUp(0.65)}
              className="liquid-glass-strong rounded-full pl-7 pr-3 py-3 flex items-center gap-5 text-sm font-medium text-white hover:scale-105 active:scale-95 transition-transform duration-300"
              data-testid="hero-cta-button"
            >
              Explore Now
              <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                <Download size={13} />
              </span>
            </motion.button>
            <motion.div {...fadeUp(0.8)} className="flex flex-wrap gap-3">
              {PILLS.map((pill) => (
                <span
                  key={pill.id}
                  className="liquid-glass rounded-full px-4 py-2 text-xs text-white/80 hover:scale-105 transition-transform duration-300 cursor-default"
                  data-testid={`pill-${pill.id}`}
                >
                  {pill.label}
                </span>
              ))}
            </motion.div>
          </div>

          <motion.div
            {...fadeUp(0.95)}
            className="flex flex-col gap-3"
            data-testid="hero-quote-block"
          >
            <span className="text-xs tracking-[0.3em] uppercase text-white/50">
              Visionary Response
            </span>
            <p className="text-lg text-white/80">
              We imagined a city that answers{" "}
              <em className="font-serif italic text-white">as one.</em>
            </p>
            <div className="flex items-center gap-4 pt-1">
              <span className="h-px w-10 bg-white/25" />
              <span className="text-xs tracking-[0.3em] uppercase text-white/60">
                ResQNet Command
              </span>
              <span className="h-px w-10 bg-white/25" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="hidden lg:flex relative w-[48%] min-h-screen flex-col p-12 pl-8">
        <motion.div
          {...fadeUp(0.5)}
          className="flex items-center justify-end gap-4"
          data-testid="right-top-bar"
        >
          <div
            className="liquid-glass rounded-full px-4 py-2 flex items-center gap-4"
            data-testid="social-links-bar"
          >
            {SOCIALS.map(({ icon: Icon, id }) => (
              <a
                key={id}
                href="#"
                aria-label={id}
                className="text-white hover:text-white/80 hover:scale-105 transition-all duration-300"
                data-testid={id}
              >
                <Icon size={15} />
              </a>
            ))}
            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
              <ArrowRight size={14} />
            </span>
          </div>
          <button
            className="liquid-glass w-11 h-11 rounded-full flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform duration-300"
            data-testid="account-button"
          >
            <Sparkles size={16} />
          </button>
        </motion.div>

        <motion.div
          {...fadeUp(0.7)}
          style={{ y: yCommunity }}
          className="liquid-glass rounded-3xl w-56 p-5 flex flex-col gap-2 mt-16 hover:scale-105 transition-transform duration-300"
          data-testid="community-card"
        >
          <h3 className="text-base font-medium text-white">Enter the network</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Agencies, units and command — one live operational picture.
          </p>
        </motion.div>

        <motion.div
          {...fadeUp(0.85)}
          style={{ y: yFeatures }}
          className="liquid-glass rounded-[2.5rem] p-4 flex flex-col gap-4 mt-auto"
          data-testid="feature-section"
        >
          <div className="flex gap-4">
            <div
              className="liquid-glass rounded-3xl flex-1 p-5 flex flex-col gap-3 hover:scale-105 transition-transform duration-300"
              data-testid="feature-card-signal"
            >
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <Wand2 size={14} />
              </span>
              <h4 className="text-sm font-medium text-white">Signal Intelligence</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Incident signals filtered, scored and ranked in real time.
              </p>
            </div>
            <div
              className="liquid-glass rounded-3xl flex-1 p-5 flex flex-col gap-3 hover:scale-105 transition-transform duration-300"
              data-testid="feature-card-archive"
            >
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <BookOpen size={14} />
              </span>
              <h4 className="text-sm font-medium text-white">Response Archive</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Every dispatch, arrival and resolution — logged and auditable.
              </p>
            </div>
          </div>
          <div
            className="liquid-glass rounded-3xl p-4 flex items-center gap-4 hover:scale-[1.03] transition-transform duration-300"
            data-testid="feature-card-coordination"
          >
            <img
              src={THUMB_URL}
              alt="Rescue teams coordinating"
              className="w-24 h-16 rounded-2xl object-cover grayscale"
              data-testid="feature-thumbnail"
            />
            <div className="flex-1 flex flex-col gap-1">
              <h4 className="text-sm font-medium text-white">
                Advanced Rescue Coordination
              </h4>
              <p className="text-xs text-white/60">
                Multi-agency dispatch with human-approved control.
              </p>
            </div>
            <button
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform duration-300"
              data-testid="feature-plus-button"
            >
              <Plus size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
