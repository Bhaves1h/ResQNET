import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { LifeBuoy, Building2, ArrowLeft, ArrowRight } from "lucide-react";
import { API, setRole, setAgency, clearRole } from "@/lib/command";

const EASE = [0.22, 1, 0.36, 1];

export default function RoleSelect() {
  const navigate = useNavigate();
  const [picking, setPicking] = useState(false); // agency picker
  const [agencies, setAgencies] = useState([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    clearRole();
  }, []);

  useEffect(() => {
    if (picking && agencies.length === 0) {
      axios.get(`${API}/agencies`).then((r) => setAgencies(r.data)).catch(() => {});
    }
  }, [picking, agencies.length]);

  const chooseUser = () => {
    setRole("USER");
    navigate("/command/user");
  };

  const confirmAgency = () => {
    const agency = agencies.find((a) => a.id === selected);
    if (!agency) return;
    setRole("AGENCY");
    setAgency({
      id: agency.id,
      name: agency.name,
      type: agency.type,
      latitude: agency.latitude,
      longitude: agency.longitude,
    });
    navigate("/command/agency");
  };

  return (
    <div
      className="relative min-h-screen bg-[#060708] text-white font-sans overflow-hidden flex flex-col"
      data-testid="role-select-page"
    >
      <div className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-white/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-white/[0.03] blur-3xl" />

      <header className="relative z-10 px-6 lg:px-10 py-6">
        <a
          href="/"
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors w-fit"
          data-testid="role-back-home"
        >
          <ArrowLeft size={15} />
          <img src="/logo.png" alt="ResQNET" className="w-6 h-6" />
          <span className="text-lg font-semibold tracking-tighter">ResQNET</span>
        </a>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <AnimatePresence mode="wait">
          {!picking ? (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="w-full max-w-4xl flex flex-col items-center gap-3"
            >
              <span className="text-xs tracking-[0.35em] uppercase text-white/40">
                ResQNet Command Center
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-center">
                How are you{" "}
                <em className="font-serif italic font-normal text-white/80">responding?</em>
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full mt-10">
                <button
                  onClick={chooseUser}
                  className="group liquid-glass-strong rounded-[2rem] p-10 flex flex-col items-start gap-5 text-left hover:scale-[1.02] active:scale-[0.99] transition-transform duration-300"
                  data-testid="role-need-help"
                >
                  <span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                    <LifeBuoy size={24} />
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-2xl font-medium tracking-tight">I need help</span>
                    <span className="text-sm text-white/55">Report an emergency</span>
                  </div>
                  <span className="mt-4 flex items-center gap-2 text-xs text-white/60 group-hover:text-white transition-colors">
                    Continue <ArrowRight size={14} />
                  </span>
                </button>

                <button
                  onClick={() => setPicking(true)}
                  className="group liquid-glass-strong rounded-[2rem] p-10 flex flex-col items-start gap-5 text-left hover:scale-[1.02] active:scale-[0.99] transition-transform duration-300"
                  data-testid="role-agency"
                >
                  <span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Building2 size={24} />
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-2xl font-medium tracking-tight">I'm an agency</span>
                    <span className="text-sm text-white/55">Respond to incidents</span>
                  </div>
                  <span className="mt-4 flex items-center gap-2 text-xs text-white/60 group-hover:text-white transition-colors">
                    Continue <ArrowRight size={14} />
                  </span>
                </button>
              </div>
              <p className="text-[11px] tracking-[0.2em] uppercase text-white/30 mt-8">
                Simulated demonstration environment — Nagpur
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="agency"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="liquid-glass-strong rounded-[2rem] p-8 lg:p-10 w-full max-w-md flex flex-col gap-5"
              data-testid="agency-picker"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-medium tracking-tight">Select your agency</h2>
                <button
                  onClick={() => setPicking(false)}
                  className="text-xs text-white/50 hover:text-white transition-colors"
                  data-testid="agency-picker-back"
                >
                  back
                </button>
              </div>
              <p className="text-sm text-white/55">
                Choose the response agency you operate. You'll see incidents relevant to your
                team and can dispatch your own units.
              </p>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="bg-white/5 rounded-2xl px-4 py-3.5 text-sm outline-none text-white"
                data-testid="agency-picker-select"
              >
                <option value="" className="bg-neutral-900">
                  — Select agency —
                </option>
                {agencies.map((a) => (
                  <option key={a.id} value={a.id} className="bg-neutral-900">
                    {a.name}
                  </option>
                ))}
              </select>
              <button
                onClick={confirmAgency}
                disabled={!selected}
                className="liquid-glass rounded-full py-3.5 text-sm font-medium flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-300 disabled:opacity-40"
                data-testid="agency-picker-confirm"
              >
                Enter agency command <ArrowRight size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
