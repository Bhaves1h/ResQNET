import { useEffect } from "react";
import Lenis from "lenis";
import Hero from "@/components/landing/Hero";
import Marquee from "@/components/landing/Marquee";
import Manifesto from "@/components/landing/Manifesto";
import Footer from "@/components/landing/Footer";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4";

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.25, smoothWheel: true });
    let rafId;
    const loop = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white font-sans antialiased">
      <video
        className="fixed inset-0 w-full h-full object-cover z-0"
        src={VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
        data-testid="hero-video-background"
      />
      <div className="fixed inset-0 z-[1] bg-black/30 pointer-events-none" />
      <main className="relative z-10">
        <Hero />
        <Marquee />
        <Manifesto />
        <Footer />
      </main>
    </div>
  );
}
