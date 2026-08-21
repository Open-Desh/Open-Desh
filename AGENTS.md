# Open Desh - System Architecture & Long-Term Project Memory

## Project Overview
**Open Desh** (Tagline: "Open Voice, Open Desh") is a high-scale, enterprise-grade civic governance, leader accountability, and real-time grievance reporting platform designed for 100,000+ citizens and elected representatives.

## Core Pillars & Product Design
1. **Feed & Grievance Reporting (Twitter/X-style)**:
   - Dedicated full-screen composition page with auto-expanding prompt `Kya Problem ha ?`.
   - Dedicated media preview slot for up to 6 evidence images (Cloudflare R2 storage architecture).
   - Live GPS reverse-geocoding (OpenStreetMap Nominatim free API) + Accuracy indicators.
   - Dynamic algorithm-based department routing (e.g. `@JharkhandPWD`, `@RMC_Swachhata`, `@RanchiJalBoard`, `@JBVNL_Electricity`, `@ACB_Jharkhand`) and elected leader routing (`@niteshgupta950`).
   - Category-specific quick audit parameters (Pothole depth, Water disruption hours, Transformer ID, Bribe amount/desk).
   - Twitter/X bottom toolbar: Gallery, Camera, Quick Poll/Fields, GIF, Category Switcher, GPS pin, character count ring, and Details (+).

2. **Leader Performance Tracker**:
   - Header with dynamic statistics: Total Leaders Tracked and Average System Score / Public Rating.
   - Separate tabs for Ruling Party and Opposition Leaders.
   - Profiles with 5-pillar System Score breakdown (Resolution Rate, Project Delivery, Legislative Activity, Transparency, Citizen Feedback - 20 pts each, Max 100).
   - Dynamic reviews and ratings with 1-voter-1-review enforcement and representative official response capabilities.

3. **Search & Discovery**:
   - Full header transformation into an X-style search bar with active tab filters (Top, Latest, People, Media, High Priority).
   - Radius & Location filter modal.

4. **Civic AI Legal Tutor & Triage**:
   - Resilient multi-model Gemini fallback (`gemini-2.5-flash` primary, `gemini-2.5-pro`, `gemini-3.7-flash`).
   - Instant legal guidance referencing Indian statutes (RTI Act 2005, CPGRAMS, Citizen SLA Charters).

## Deployment & Hosting Blueprint
- **Frontend & Fullstack Options**:
  - Cloudflare Pages + Cloudflare Workers / Node Runtime
  - Google Cloud Run (Containerized single-service architecture)
  - Render / Railway / Vercel with Node Backend
- **Media Asset Storage**: Cloudflare R2 bucket for high-speed multi-image storage.
- **Port**: 3000 (Internal & Production Container Ingress).
