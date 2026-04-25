import { MODULE_ID, SETTINGS, STAMINA_LABEL, FLAG_NAMESPACE } from "../constants.mjs";
import { log } from "../util/log.mjs";

export function readStamina(actor) {
  const r = actor?.system?.resources?.tertiary ?? {};
  const configured = r.label === STAMINA_LABEL && Number.isFinite(r.max);
  return {
    value: r.value ?? 0,
    max: r.max ?? 0,
    label: r.label ?? "",
    configured,
    sr: !!r.sr,
    lr: !!r.lr
  };
}

export function canAfford(actor, item) {
  const cost = item?.flags?.[FLAG_NAMESPACE]?.staminaCost ?? 0;
  const { value } = readStamina(actor);
  return cost === 0 || value >= cost;
}

export async function initialiseStaminaPool(actor) {
  const existing = readStamina(actor);
  if (existing.configured) {
    const proceed = await Dialog.confirm({
      title: game.i18n.localize("OKNAJAN.dialogs.initStamina.title"),
      content: `<p>${game.i18n.localize("OKNAJAN.dialogs.initStamina.overwrite")}</p>`,
      defaultYes: false
    });
    if (!proceed) return;
  }

  const formula = game.settings.get(MODULE_ID, SETTINGS.staminaMaxFormula);
  const rollData = actor.getRollData();
  const roll = new Roll(formula, rollData);
  await roll.evaluate({ async: true });
  const max = Math.max(0, Math.round(roll.total));

  const policy = game.settings.get(MODULE_ID, SETTINGS.recoveryPolicy);
  const sr = policy === "short" || policy === "both";
  const lr = policy === "long"  || policy === "both";

  await actor.update({
    "system.resources.tertiary.label": STAMINA_LABEL,
    "system.resources.tertiary.value": max,
    "system.resources.tertiary.max":   max,
    "system.resources.tertiary.sr":    sr,
    "system.resources.tertiary.lr":    lr
  });

  log.info(`initialised stamina pool for ${actor.name}: ${max} (${policy})`);
}
