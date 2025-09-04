# Rich Core Systems

Modular deterministic game core (TypeScript, pure functions, snapshot-friendly).

## Features Overview
| Domain | Key Module | Capabilities |
|--------|------------|--------------|
| Time | `weekState` | Init week, allocate activity/travel, carry-over penalties |
| Travel | `travelCalc` | Route time computation with bonuses & efficiency multiplier |
| Activities | `activityExec` | All-or-nothing execution, logging, multipliers |
| Status Bars | `statusBars` | Apply deltas with clamp & overdraft detection |
| Obligations | `obligations` | Tag frequency check → penalties (time/money) |
| Upgrades | `upgrades` | Purchase + additive percent → capped multipliers |
| Finance | `finance` | Loans (weekly repayment, penalties), investments, early repay |
| Forecast | `forecast` | Pure preview (time, rewards, penalties, finance, auto multipliers) |
| Summary | `weekSummary` | Aggregate rewards, penalties, ROI, grouping |
| Victory | `victory` | Evaluate 4-bar threshold completion |
| Integration | `weeklyFlow` | Orchestrates week + optional summary & victory |

## Architecture Principles
1. Purity & Determinism: Functions avoid side effects; all state passed explicitly.
2. Immutability: Returned states are frozen (Object.freeze) to prevent accidental mutation.
3. Result Pattern: Consistent `ok/err` wrappers for error handling.
4. Additive Percent Multipliers: Upgrades accumulate then cap per category; applied late.
5. Forecast Separation: Planning uses pure arithmetic (no allocation mutation) + penalty & finance projection.

## Quick Start
```bash
npm install
npm test
npm run demo
```

## Demo
`npm run demo` executes `src/demo/weekDemo.ts` printing summary, purchases, victory, and an early loan repayment example.

## Using Forecast
Call `simulatePlan({ week, tentativeActivities, obligationTags, upgradeMultipliers })` to get:
`{ netDeltas, timeUsage, projectedPenalties, projectedInvestmentValues, warnings }`.

## Summary Grouping
If executionLog length exceeds `maxEntries`, summary aggregates rewards per derived category (prefix before ':' or '-').

## Victory Evaluation
`evaluateVictory(bars, thresholds, week)` returns `{ isVictory, weekOfCompletion?, completionSnapshot? }`.

## Scripts
| Script | Purpose |
|--------|---------|
| build | Type-check & emit JS |
| test | Run full test suite (node --test + ts-node loader) |
| lint | ESLint check |
| demo | Run example weekly simulation |

## CI
Workflow: `.github/workflows/ci.yml` (Node 20, cache npm, lint + test). All 100+ tests must pass.

## Story Coverage
All stories STORY-001 → STORY-010 complete. See `docs/stories/` for specs & DoD.


