# Cardia Development Plan Request

## Operating Mode

**READ-ONLY PLANNING TASK. DO NOT EDIT FILES. DO NOT GENERATE OR REPLACE 3D GEOMETRY. DO NOT DOWNLOAD MODELS.**

Inspect repository, then return plan. Stop after plan. Implementation requires separate written approval.

## Project

- Stack: vanilla JavaScript, Three.js, Vite
- Local atlas: `public/models/cardiovascular.glb`
- Renderer: `src/heart.js`
- Valve-related schematic code: `src/annuli.js`
- UI: `src/main.js`
- Educational content: `src/content.js`
- Tests: `scripts/`

Current product already contains:

- Registered chamber, vessel, coronary, venous, and valve meshes.
- Anatomy, angiography, ablation, pacemaker, transseptal, and Bachmann modes.
- Camera presets, C-arm controls, bilingual content, and local rendering.
- Experimental procedural mitral anatomy. Current valve result is not accepted.

## Reference

- Site: <https://sujalkanu-stack.github.io/Heart-simulator/>
- Repository: <https://github.com/sujalkanu-stack/Heart-simulator>

Reference may inform interaction design only:

- BPM control.
- Play/pause.
- Guided tour.
- Quiz.
- Structure selection and information card.
- Conceptual blood-flow display.

Do not copy:

- Sketchfab model or iframe architecture.
- Model assets.
- Branding or text.
- Disease claims.
- Generic whole-heart scaling animation.

## Current Problem

Previous attempts produced anatomically poor valve geometry. Main failures:

- AML, PML, AMC, chordae, and papillary structures became visually disconnected or oversized.
- Procedural surfaces intersected aortic cusps or entered lumens.
- Geometry was changed before visual acceptance.
- Animation planning started before anatomy freeze.

Plan must prevent these failures.

## Hard Constraints

1. Do not edit `src/annuli.js` during planning.
2. Do not alter `public/models/cardiovascular.glb`.
3. Do not invent missing anatomy from generic coordinates.
4. Do not add another external heart model.
5. Do not infer clinical accuracy from visual plausibility.
6. Keep atlas and schematic structures distinct.
7. Preserve existing coordinate registration.
8. Preserve local/offline operation.
9. Preserve on-demand rendering while animation is paused.
10. Backend is optional. Do not propose backend unless server state is required.

## Required Planning Sequence

### Gate 1 — Repository Audit

Report only:

- Current scene architecture.
- Mesh sources and provenance.
- Which structures come from atlas.
- Which structures are procedural.
- Current animation mechanism.
- Current test coverage.
- Dirty/untracked files relevant to valve work.
- Exact technical cause of current anatomy failures.

No edits.

### Gate 2 — Anatomy Recovery Plan

Propose recovery choices in ranked order:

1. Use valid existing atlas meshes without procedural replacement.
2. Repair source-node mapping or transforms if atlas geometry exists but is hidden/misidentified.
3. Use author-prepared Blender/GLB anatomy with verified license and registration.
4. Use bounded schematic geometry only when no anatomical asset exists.

For every choice provide:

- Evidence required.
- Files affected.
- Anatomical risk.
- Visual acceptance views.
- Automated geometry checks.
- Rollback path.

Do not choose approach yet. Human chooses after review.

### Gate 3 — Anatomy Freeze Criteria

Define approval package containing:

- Anterior view.
- Posterior view.
- RAO view.
- LAO view.
- Aortic-root cutaway.
- Mitral-valve cutaway.
- Isolated AML/PML/chordae/papillary view.
- Isolated AMC view.

Required checks:

- No floating structures.
- No lumen penetration.
- No leaflet duplication.
- No chordal detachment.
- No mesh self-intersection.
- All schematic structures labeled schematic.
- User visually approves anatomy before animation work.

### Gate 4 — Animation Architecture

Plan animation only after anatomy freeze.

State engine requirements:

```js
{
  bpm: 72,
  phase: 0,
  playing: false,
  rhythm: 'sinus',
  reducedMotion: false
}
```

Required properties:

- Deterministic `0..1` cardiac-cycle phase.
- `cycleDurationMs = 60000 / bpm`.
- Pause, resume, and phase seek.
- No DOM dependency in cycle engine.
- No uniform whole-heart scaling.
- Separate motion channels for atria, ventricles, valves, papillary/chordae, conduction, and conceptual flow.
- Animation implementation must use accepted mesh capabilities: morph targets, skinning, or small bounded schematic transforms.

Plan must state what happens if accepted atlas contains no morph targets. Do not invent deformation implementation during planning.

### Gate 5 — Interaction Features

After animation architecture:

- BPM controls.
- Structure hover/click.
- World-to-screen labels.
- Guided tour.
- Quiz.
- Conceptual blood-flow routes.
- Local progress storage.

Each feature needs:

- Dependency.
- Files affected.
- Test strategy.
- Performance cost.
- Accessibility requirement.

### Gate 6 — Backend Decision

Default decision: no backend.

Backend becomes valid only for:

- Accounts.
- Cross-device progress.
- Instructor classes.
- Shared annotations.
- Content administration.

If none approved, recommend versioned local JSON plus schema validation and local storage.

## Verification Commands

Plan must map every phase to existing or proposed checks:

```sh
npm run check
npm test
npm run build
npm run test:browser
```

Do not claim browser suite passes without running it. Record existing unrelated failures separately.

## Required Output Format

Return Turkish report with exactly these sections:

1. `Mevcut Durum`
2. `Kök Nedenler`
3. `Anatomi Kurtarma Seçenekleri`
4. `Önerilen Fazlar ve Onay Kapıları`
5. `Dosya Bazlı Etki Haritası`
6. `Test ve Görsel Kabul Matrisi`
7. `Backend Kararı`
8. `Riskler ve Ertelenenler`
9. `İlk Uygulama Görevi İçin Öneri`

Final section must propose one small first task. It must not execute task.

## Forbidden Output

- Code edits.
- Patch or diff.
- New procedural anatomy.
- New model asset.
- Framework migration.
- Deployment instructions.
- Claims of anatomical or clinical validation.
- Full multi-phase implementation in one run.

Stop after plan.
