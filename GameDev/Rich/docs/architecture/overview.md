# Architecture Overview

## Module Layers
- Core State: `weekState`, `statusBars`
- Domain Logic: activities, travel, obligations, upgrades, finance
- Projection: forecast (pure preview), summary, victory
- Integration: weeklyFlow orchestrator

## Data Flow (Weekly)
1. Init week -> executePlan -> applyDeltas -> evaluateObligations -> penalties -> purchases -> multipliers -> finance repayment -> summary -> victory.
2. Forecast branches earlier: uses raw activity list + upgrade multipliers + obligations config (no mutation) for planning.

## Determinism
No RNG; all outputs derived from inputs. Penalty aggregation sorts by type; upgrade & obligation processing use stable iteration order.

## Multipliers
Additive percentages per category, capped via `computeMultipliers`. Applied late (after base reward/time calculations) to maximize clarity.

## Finance
Loans: flat principal schedule + simple interest; overdue adds penaltyRate to interest. Early repayment reduces principal without altering schedule counters.
Investments: discrete weekly compounding by growthRate.

## Forecast Enhancements
Penalty projection builds a pseudo log (assuming success). Finance preview only calculates investment values to avoid state mutation.

## Serialization
State objects are plain JSON-friendly; helper added (`serialization.ts`) to export/import snapshot bundles.
