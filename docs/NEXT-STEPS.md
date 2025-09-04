# NEXT STEPS ROADMAP (Draft)

> Snapshot written while you are away. Focus is to evolve from basic time-only map prototype to fully playable loop with planning, forecasting, upgrades, finance, and multi‑week progression.

## 0. Immediate Cleanups
- [ ] Split web code into modules (`/src/web/state.ts`, `ui.ts`, `actions.ts`) to avoid monolith.
- [ ] Add lightweight TypeScript path alias for `systems/*` if needed.
- [ ] ESLint rule adjust for browser (env + globals) or add `/// <reference lib="dom" />`.

## 1. Activity & Reward Integration
- [ ] Replace simple queued `MapLocation` with transformation to core `ActivityDef` (include `rewards`, `tags`).
- [ ] On simulate: use existing `executePlan` (activityExec) instead of manual allocate loop.
- [ ] Display aggregated resource deltas (money, health, happiness, education) under HUD.
- [ ] Add status bar components (progress bars toward thresholds) fed by `applyDeltas`.

## 2. Forecast Engine Hook (Story-008)
- [ ] Wire `simulatePlan` for the queued activities (pass week + activities + obligationTags).
- [ ] Show: timeUsage (activity vs travel), netDeltas, warnings, projected penalties (if configs defined), expectedCost.
- [ ] Color-code warnings (OVER_TIME, MISSING_TAG*, PENALTIES_PROJECTED).

## 3. Travel Route Planning (Story-002)
- [ ] Enable click sequence to build travel path: (Shift+click) adds to route; show polyline overlay (canvas/SVG).
- [ ] Call `computeTravel` with chosen path & travel multipliers; update forecast timeUsage.travelTime.
- [ ] Visual feedback if route invalid or exceeds remaining time.

## 4. Obligations & Penalties (Story-005)
- [ ] Define obligation configs (e.g. WORK 5/week, HEALTH 3/week, STUDY 3/week, FUN 2/week).
- [ ] Provide UI checklist showing which tags satisfied by current queued plan.
- [ ] In forecast panel list projected penalties and resulting next-week time penalty.

## 5. Upgrades System (Story-006)
- [ ] Add upgrades catalog side panel (name, category, cost, bonus%).
- [ ] Persist owned upgrades in session state.
- [ ] Compute multipliers (reward, activityTimeEfficiency, travel) and feed into forecast + simulation.
- [ ] Display cumulative multiplier summary (raw vs capped) and ROI placeholder.

## 6. Finance (Story-007)
- [ ] Add simple loan form (amount, rate, weeks) -> call `issueLoan`.
- [ ] Weekly simulate: call `weeklyRepayment` after activities & upgrade purchases.
- [ ] Investments: open small growth investment; preview value in forecast (if includeInvestments).
- [ ] Display finance panel: balance, loans (remaining / weekly due / overdue flag), investments (weeks held, projected value).

## 7. Week Summary & Victory (Stories 009 & 010)
- [ ] After simulation, call `buildWeekSummary` -> show resourceTotals, penaltiesApplied, advisory.
- [ ] Evaluate victory each week; show banner if thresholds met.
- [ ] Provide "Advance Week" button: carry over time penalty, increment week counter, keep owned upgrades / finance state.

## 8. Persistence & Snapshot
- [ ] Use `exportSnapshot` / `importSnapshot` to allow manual Save/Load (localStorage + download JSON).
- [ ] Include: current week number, bars, finance, ownedUpgrades, pending loans/investments.

## 9. Visual & UX Enhancements
- [ ] Replace placeholder background with real city map asset; responsive fit & optional zoom/pan (Wheel to zoom, drag to pan).
- [ ] Tooltips styled; highlight pins in route order; numbering badges for route.
- [ ] Color-coded activity categories.
- [ ] Animations for bar growth on simulation.

## 10. Testing & Quality
- [ ] Add Vitest (or keep Node test) for web-specific pure helpers (route building, state transforms).
- [ ] Add screenshot smoke test (Playwright) for key flows: queue + forecast + simulate.
- [ ] Lint config: add browser env + adjust rules ignoring `any` in UI glue where acceptable.
- [ ] GitHub Action: add build of web (vite build) along with existing core tests.

## 11. Performance / DX
- [ ] Derive memoized forecast (hash of plan + multipliers) to avoid recompute spam.
- [ ] Introduce event bus or state store (simple signal or lightweight observable) once complexity increases.
- [ ] Bundle split (core engine vs UI) if size becomes relevant.

## 12. Stretch Ideas
- [ ] Drag-drop reorder queue with HTML5 Drag events.
- [ ] Multi-player slots (P1 / P2) alternating planning phases.
- [ ] Random weekly events (pure deterministic seed) layered atop forecast.
- [ ] Analytics overlay: cumulative progression graph.

## Prioritized Sequence (Suggested)
1. Activity/Rewards integration & status bars.
2. Forecast deep integration + obligations.
3. Travel routing & multipliers interplay.
4. Upgrades UI.
5. Week summary + multi-week loop.
6. Finance module UI.
7. Persistence & victory.
8. Visual polish + tests.

## Data Contracts (Quick Reminder)
- ActivityDef: { id, timeCost, rewards, tags }
- simulatePlan: supply upgradeMultipliers derived from owned upgrades' computeMultipliers.
- simulateWeek integration order (existing backend reference): executePlan -> obligations -> penalties -> purchases -> multipliers -> finance -> summary -> victory.

## Minimal Next Commit Targets (When You Return)
- [ ] Refactor `mapApp.ts` into `state`, `ui`, `forecastAdapter` (scaffold only).
- [ ] Convert location click -> push ActivityDef list + show reward preview inline in queue.
- [ ] Invoke `executePlan` for simulation and show delta bars.

_You can tick items and commit incrementally. Let me know if you want this auto-split into tasks with IDs next session._
