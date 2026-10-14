# Stage depth and living image implementation plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement these tasks in the current session. The user approved the five-part design and requested implementation.

**Goal:** Make the existing stage composition visibly richer through depth, real 3D, tactile glass controls, asymmetric rhythm and a localized moving photographic frame.

**Architecture:** Keep the static HTML and existing Framer Motion lifecycle. The current Canvas ribbon is an immediate fallback; a separate local Three.js bundle upgrades it asynchronously. Decorative parallax and the living frame share pause, visibility and reduced-motion rules. Original photos, content and manual controls remain accessible.

**Tech stack:** Framer Motion DOM, Three.js, CSS, Canvas fallback, FFmpeg, Chromium/Playwright.

**Spec:** The user-approved five-part design in this conversation, with implementation details recorded in `docs/motion-design.md`.

## Global constraints

- First photograph remains `041.jpg`, fully contained on mobile and desktop.
- Ordinary scrolling, working age selection, native touch scrolling, explicit pause and `prefers-reduced-motion` remain supported.
- Self-host all assets. No external runtime fonts, model URLs or video services.
- Mobile layout must fit widths 320/390/700px without horizontal overflow.
- New moving media must stop offscreen and in hidden tabs; video must be silent and inline.

## Review focus

- WebGL failure/context loss: return to the Canvas scene or readable static content.
- Reduced-motion changes during async loads: never restart animation without authorization.
- Touch swipe across a visual: preserve native scroll and local pause.
- Media autoplay rejection: show the static poster and retain an explicit play control.
- Asymmetric desktop placement: stack into a clear mobile sequence without covering text or faces.

## Task 1 — Layered depth, glass and rhythm

Files: `design/stage-effects.js` (decorative layers and media lifecycle), `design/stage.css`, `design/motion-source.js`, `design/check-stage-depth.cjs`.

- [x] Add a browser regression for decorative scroll movement and stop/reset behavior.
- [x] Verify it fails before the new layers exist.
- [x] Create contained decorative layers around the banner and selected sections; move them through Framer Motion scroll, independently from photos/text.
- [x] Add supported frosted-glass controls and restrained highlights/shadows to buttons.
- [x] Stagger desktop portraits and gallery columns using reserved layout spacing, not mobile offsets.
- [x] Run the new checks and existing responsive/selection tests.

## Task 2 — True 3D ribbon

Files: `design/ribbon-webgl.js`, `design/ribbon-scene.js`, `scripts/build-site-motion.cjs`, `package.json`, `package-lock.json`, `design/check-stage-depth.cjs`.

- [x] Add a check that actual WebGL upgrades the visible ribbon and Canvas remains when WebGL is unavailable.
- [x] Install a pinned Three.js version and build an independent local ES module.
- [x] Render a deforming ribbon mesh with normals, reflective material, lights and particles; maintain the existing gesture/pause controls.
- [x] Upgrade after the immediate Canvas visual; handle async gating, resize and context loss.
- [x] Verify actual pixels change, pause works, reduced motion is still, native touch scrolling works and fallback is readable.

## Task 3 — Localized moving photograph

Files: `scripts/build-living-frame.sh`, `research/videos/living-frame.mp4`, `research/assets/living-frame.jpg`, `design/stage-effects.js`, both homepage HTML files, `design/check-stage-depth.cjs`.

- [x] Inspect sources for a stable shot and a subject that stays in a bounded region.
- [x] Build a short masked loop from a rehearsal: freeze most of the scene and animate only one performer/scarf, with softened mask edges.
- [x] Review the result visually; reject visible seams or camera drift and use a simple honestly labelled living video if necessary.
- [x] Place one framed visual in the school section, with a static poster, explicit pause and on-screen-only playback.
- [x] Verify no network fetch/playback under reduced motion, silent inline playback, and fallback after autoplay rejection.

## Task 4 — Verification and publication

- [x] Run stage-depth, ribbon, scene autoplay, curtain timing, scroll-motion, responsive, transferred-content and module checks.
- [x] Inspect desktop/mobile screenshots and contrast of glass controls.
- [x] Request an independent code review and resolve important findings.
- [x] Commit, push to main, await Pages deployment and repeat behavior checks on the public URL.
- [x] Update `docs/motion-design.md` with implementation, reproduction commands and measured limits.

Ruling: Localized movement uses the stable rehearsal shot, not the brand-logo animation. The mask is applied in planar RGB so all channels are truly frozen outside the selected performer. A short forward/reverse loop avoids a visible cut.

Independent review: no blocking findings. Delayed Three.js import with reduced motion toggled mid-load, rejected media autoplay, and normal Three/layer initialization passed. A transient 5-second initialization deadline under concurrent browser tests was extended to 20 seconds. Desktop/mobile screenshots and the RGB mask were inspected; the frozen region has a mean RGB difference of 0.041 versus 10.489 inside the moving region between sampled frames.

Publication: implementation commit `11f75e6` was pushed to `main`; Pages workflow `38586868088` completed successfully. `check-stage-depth.cjs` passed against the public HTTPS URL: actual Three renderer, paused/resumed pixels, context-loss fallback, scroll depth, glass controls, living-frame playback/pause, reduced-motion network suppression and mobile layout. The cloud verification transport preserved HTTP range headers for video and used the platform HTTPS trust store. Desktop handoff instructions are in `docs/codex-handoff.md`.
