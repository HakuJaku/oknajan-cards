import {
  FLAG_NAMESPACE,
  STAMINA_CONSUMPTION_TARGET_TYPE,
  STAMINA_CONSUMPTION_TARGET_PATH
} from "../constants.mjs";
import { log } from "./log.mjs";

/**
 * Keep flags.oknajan-cards.staminaCost in sync with the feat's primary
 * activity consumption.targets. Writes both in one update.
 *
 * §6.4 confirmed the target shape: { type, target, value: "<string formula>" }.
 * The module writes the cost as a string. RV3 confirms this at runtime.
 */
export async function syncTechniqueConsumptionTarget(item, cost) {
  if (item.type !== "feat") return;
  cost = Math.max(0, Math.floor(Number(cost) || 0));
  const activationType = item.system?.activation?.type;
  const isPassive = !activationType || activationType === "none" || activationType === "";

  const updates = {};
  updates[`flags.${FLAG_NAMESPACE}.staminaCost`] = cost;

  // system.activities is a Map-like Collection; serialise via toObject or Object.entries
  const activities = item.system?.activities;
  if (!activities || (typeof activities.size === "number" ? activities.size === 0 : Object.keys(activities).length === 0)) {
    if (!isPassive && cost > 0) {
      ui.notifications?.warn(game.i18n.localize("OKNAJAN.warn.noActivityForTechnique"));
    }
    await item.update(updates);
    return;
  }

  // Iterate activity entries — support both Collection and plain-object shapes.
  const entries = activities.entries ? Array.from(activities.entries()) : Object.entries(activities);
  if (isPassive || cost === 0) {
    // Strip any prior stamina targets from every activity.
    for (const [aid, activity] of entries) {
      const prior = activity.consumption?.targets ?? [];
      const filtered = Array.from(prior).filter(t =>
        !(t.type === STAMINA_CONSUMPTION_TARGET_TYPE && t.target === STAMINA_CONSUMPTION_TARGET_PATH)
      );
      updates[`system.activities.${aid}.consumption.targets`] = filtered;
    }
  } else {
    // Write the stamina target onto the primary (first) activity.
    const [primaryId, primary] = entries[0];
    const prior = primary.consumption?.targets ?? [];
    const filtered = Array.from(prior).filter(t =>
      !(t.type === STAMINA_CONSUMPTION_TARGET_TYPE && t.target === STAMINA_CONSUMPTION_TARGET_PATH)
    );
    filtered.push({
      type: STAMINA_CONSUMPTION_TARGET_TYPE,
      target: STAMINA_CONSUMPTION_TARGET_PATH,
      value: String(cost) // FormulaField — string form. See §6.4 and RV3.
    });
    updates[`system.activities.${primaryId}.consumption.targets`] = filtered;
    // Strip stamina targets from any other activities.
    for (let i = 1; i < entries.length; i++) {
      const [aid, activity] = entries[i];
      const prior2 = activity.consumption?.targets ?? [];
      const filtered2 = Array.from(prior2).filter(t =>
        !(t.type === STAMINA_CONSUMPTION_TARGET_TYPE && t.target === STAMINA_CONSUMPTION_TARGET_PATH)
      );
      updates[`system.activities.${aid}.consumption.targets`] = filtered2;
    }
  }

  await item.update(updates);
}
