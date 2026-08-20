import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

const CHAPTERS = [
  {
    number: "01",
    title: "See",
    accent: "everything.",
    body: "One live operational picture — every incident, every unit, every agency, mapped and synced in real time across the network.",
    id: "chapter-see-everything",
  },
  {
    number: "02",
    title: "Recommend,",
    accent: "never replace.",
    body: "Explainable scoring weighs capability, availability, distance and workload — then hands the decision back to the human dispatcher.",
    id: "chapter-recommend",
  },
  {
    number: "03",
    title: "Respond",
    accent: "as one.",
    body: "Human-approved dispatch, tracked from en route to on scene to resolved. Many agencies. A single coordinated response.",
    id: "chapter-respond",
  },
];

export default function Manifesto() {
  return (
    <section
      className="relative py-28 lg:py-40 px-6 lg:px-16"
      data-testid="manifesto-section"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: EASE }}
          className="flex flex-col gap-5"
        >
          <span className="text-xs tracking-[0.3em] uppercase text-white/50">
            The Manifesto
          </span>
          <h2 className="text-4xl lg:text-5xl font-medium tracking-tight text-white leading-tight">
            Built for the{" "}
            <em className="font-serif italic font-normal text-white/80">
              golden hour.
            </em>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CHAPTERS.map((chapter, i) => (
            <motion.article
              key={chapter.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.9, delay: i * 0.15, ease: EASE }}
              className="liquid-glass rounded-3xl p-8 lg:p-10 flex flex-col gap-6 hover:scale-105 transition-transform duration-300"
              data-testid={chapter.id}
            >
              <span className="text-6xl lg:text-7xl font-medium tracking-tighter text-white/15">
                {chapter.number}
              </span>
              <h3 className="text-2xl font-medium text-white leading-snug">
                {chapter.title}{" "}
                <em className="font-serif italic font-normal text-white/80">
                  {chapter.accent}
                </em>
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">
                {chapter.body}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
