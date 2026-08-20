# RESQNET — PRD

## Original Problem Statement
Build a landing page for RESQNET, a disaster-management app that helps rescue agencies coordinate. The user supplied an exact design prompt (originally for a plant app "Bloom"): full-screen liquid-glass morphism hero over a looping video background, strict grayscale palette, Poppins + Source Serif 4 typography, two-panel split layout (52% left / 48% right), adapted to RESQNET copy. A full backend spec (recommendation engine, dispatch API, seed data, tests) was included in the prompt but deferred by user choice to a follow-up. Enhancement directive: Awwwards-level polish — framer-motion reveals, lenis smooth scroll, editorial marquee, numbered manifesto chapters.

## User Personas
- Emergency dispatcher evaluating RESQNET
- Agency operator (fire/medical/police/rescue)
- Hackathon judges / demo viewers

## Core Requirements (static)
- Exact Bloom liquid-glass design adapted to RESQNET branding and copy
- Keep the provided video background URL
- Text/logo-mark created in-house (user may supply a real logo later)
- Strict grayscale, no colored accents
- Premium motion: masked hero reveal, smooth scroll, scroll-reveals, marquee, manifesto chapters

## Architecture
- React (CRA + craco) frontend only; no backend work this phase
- Components: `src/components/landing/Hero.jsx`, `Marquee.jsx`, `Manifesto.jsx`, `Footer.jsx`
- Liquid glass tiers in `index.css` @layer components (`.liquid-glass`, `.liquid-glass-strong`) per exact spec
- `lenis` for momentum scroll; `framer-motion` for entrance + parallax
- Logo mark generated procedurally at `public/logo.png` (white ring + rescue cross, transparent)

## Implemented (2026-08-20)
- Full-screen hero: video bg (exact URL), left glass panel (nav, logo, masked line-by-line h1 reveal "Uniting the / spirit of response", Explore Now CTA, 3 feature pills, quote block), right panel (social pill, account button, community card, feature cards with parallax)
- Slow editorial marquee (multi-agency coordination strip)
- Numbered manifesto chapters 01/02/03 with scroll reveals
- Footer with brand + "Simulated demonstration environment — Nagpur"
- Lenis smooth scrolling, grayscale-only palette, all interactive elements have data-testid
- Verified via screenshots: hero, marquee, manifesto, footer all render; no blocking console errors

## Backlog (prioritized)
### P0 (next session, per backend spec)
- FastAPI backend: agencies/units/incidents/incident-units/incident-events models (MongoDB)
- Recommendation engine: 5-factor explainable scoring (capability 35%, availability 20%, distance 20%, workload 15%, incident priority 10%), Haversine distance, hard capability/availability eligibility
- Endpoints: POST/GET /api/incidents, PATCH status, GET /api/units, GET /api/agencies, GET /api/incidents/:id/recommendations, POST /api/incidents/:id/dispatch (with revalidation)
- Seed data: ~10 agencies, 30–40 units, 5–7 incidents in Nagpur
- Recommendation engine unit tests (11 cases from spec)
### P1
- Command Center UI consuming recommendations endpoint (RECOMMENDED RESPONSE → DISPATCH → LIVE STATUS)
- Role scaffolding: ADMIN / DISPATCHER / AGENCY_OPERATOR / FIELD_RESPONDER
- Incident event timeline display
### P2
- Realtime updates (WebSockets) for unit/incident status
- Real road-routing ETA (MVP uses distance/speed estimate)
- User-provided official RESQNET logo swap-in

## Next Tasks
1. Build backend per spec (models, recommendation engine, dispatch safety, seed, tests)
2. Command Center page wired to recommendations API
3. Realtime status channel
