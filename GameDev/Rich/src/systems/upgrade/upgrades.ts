/**
 * Upgrade & Multipliers Application (STORY-006)
 */

import { Result, ok, err } from '../../shared/result.js';

export interface UpgradeDef {
  id: string;
  category: string; // e.g. 'travel','activity','reward'
  cost: number; // must be >=0
  bonusPercent: number; // decimal: 0.1 = +10%
  unique: boolean;
}

export interface UpgradeState {
  money: number;
  owned: string[]; // upgrade ids
}

export interface HardCapsConfig { [category: string]: number; }

export type PurchaseErrorCode = 'UNKNOWN_UPGRADE' | 'INSUFFICIENT_FUNDS' | 'DUPLICATE' | 'INVALID_VALUE';

export interface PurchaseError {
  code: PurchaseErrorCode;
  message: string;
}

export interface PurchaseSuccess {
  newState: UpgradeState;
  purchased: UpgradeDef;
  newMoney: number;
  owned: string[]; // convenience alias newState.owned
}
export type PurchaseResult = Result<PurchaseSuccess, PurchaseError>;

export function purchaseUpgrade(
  defs: UpgradeDef[],
  state: UpgradeState,
  upgradeId: string,
): PurchaseResult {
  const def = defs.find(d => d.id === upgradeId);
  if (!def) return err({ code: 'UNKNOWN_UPGRADE', message: 'upgrade not found' });
  if (def.cost < 0 || def.bonusPercent < 0) return err({ code: 'INVALID_VALUE', message: 'invalid definition values' });
  if (def.unique && state.owned.includes(def.id)) return err({ code: 'DUPLICATE', message: 'unique upgrade already owned' });
  if (state.money < def.cost) return err({ code: 'INSUFFICIENT_FUNDS', message: 'not enough money' });
  const newMoney = state.money - def.cost;
  const newOwned = [...state.owned, def.id];
  // Freeze shallowly but keep type compatibility (cast) since interface not readonly
  const newState = Object.freeze({ money: newMoney, owned: Object.freeze([...newOwned]) as unknown as string[] }) as UpgradeState;
  return ok({ newState, purchased: def, newMoney, owned: newOwned });
}

export interface MultipliersComputation {
  raw: Record<string, number>; // uncapped sums
  multipliers: Record<string, number>; // after cap
}

export function computeMultipliers(
  ownedIds: string[],
  defs: UpgradeDef[],
  hardCaps?: HardCapsConfig,
): MultipliersComputation {
  const raw: Record<string, number> = {};
  for (const id of ownedIds) {
    const def = defs.find(d => d.id === id);
    if (!def) continue; // ignore unknown id (robustness)
    if (def.cost < 0 || def.bonusPercent < 0) continue; // defensive skip
    raw[def.category] = (raw[def.category] ?? 0) + def.bonusPercent;
  }
  const multipliers: Record<string, number> = {};
  for (const [cat, sum] of Object.entries(raw)) {
    const cap = hardCaps ? hardCaps[cat] : undefined;
    multipliers[cat] = cap != null ? Math.min(sum, cap) : sum;
  }
  return Object.freeze({ raw: Object.freeze({ ...raw }), multipliers: Object.freeze({ ...multipliers }) });
}
