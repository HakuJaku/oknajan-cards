import { MODULE_ID, FLAG_NAMESPACE, HOOKS } from "../constants.mjs";
import { isCardItem } from "../cards/card-renderer.mjs";
import { log } from "../util/log.mjs";

const DIALOG_TEMPLATE = `modules/${MODULE_ID}/templates/dialogs/empowerment.hbs`;

/** Transient empowerment selections keyed by activity.uuid. */
const pending = new Map();

export function registerEmpowermentHooks() {
  Hooks.on("renderActivityUsageDialog", onRenderUsageDialog);
  Hooks.on(HOOKS.preUseActivity, onPreUseActivity);
  Hooks.on(HOOKS.preRollDamage, onPreRollDamage);
  Hooks.on(HOOKS.postUseActivity, onPostUseActivity);
}

async function onRenderUsageDialog(app, element, context, options) {
  try {
    const activity = app?.activity;
    const item = activity?.item;
    if (item?.type !== "spell" || !isCardItem(item)) return;
    const flags = item.flags[FLAG_NAMESPACE];
    if ((flags.progressionTier ?? 0) < 2) return;
    const cap = flags.spellConfig?.empowermentCap ?? 0;
    if (cap <= 0) return;

    const root = element instanceof HTMLElement ? element : element?.[0];
    if (!root || root.querySelector(".ok-empowerment-fieldset")) return;

    const html = await foundry.applications.handlebars.renderTemplate(DIALOG_TEMPLATE, { cap });
    const form = root.querySelector("form") ?? root;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    form.appendChild(wrapper.firstElementChild);
  } catch (err) {
    log.error("empowerment dialog injection failed", err);
  }
}

function onPreUseActivity(activity, usageConfig, dialogConfig, messageConfig) {
  try {
    const item = activity?.item;
    if (item?.type !== "spell" || !isCardItem(item)) return;
    const flags = item.flags[FLAG_NAMESPACE];
    if ((flags.progressionTier ?? 0) < 2) return;

    const dialog = findUsageDialogFor(activity);
    const input = dialog?.element?.querySelector?.('input[name="ok-empowerment-count"]');
    const cap = flags.spellConfig?.empowermentCap ?? 0;
    const count = input ? Math.max(0, Math.min(cap, parseInt(input.value, 10) || 0)) : 0;
    if (count > 0) pending.set(activity.uuid ?? activity.id, count);
  } catch (err) {
    log.error("preUseActivity empowerment capture failed", err);
  }
}

function findUsageDialogFor(activity) {
  for (const app of Object.values(ui.windows ?? {})) {
    if (app?.activity?.uuid === activity?.uuid) return app;
  }
  return null;
}

function onPreRollDamage(rollConfig, dialogConfig, messageConfig) {
  try {
    const activity = rollConfig?.subject;
    if (!activity) return;
    const key = activity.uuid ?? activity.id;
    const count = pending.get(key);
    if (!count) return;

    const parts = rollConfig.rolls?.[0]?.parts
      ?? rollConfig.parts
      ?? activity.damage?.parts;
    if (!parts?.length) return;
    const base = parts[0];
    const formula = typeof base === "string" ? base : base.formula;
    const match = /(\d+)d(\d+)/i.exec(formula ?? "");
    if (!match) return;
    const dieSize = match[2];
    const extra = `${count}d${dieSize}`;

    if (typeof base === "string") {
      parts[0] = `${base} + ${extra}`;
    } else {
      base.formula = `${base.formula} + ${extra}`;
    }
    log.debug(`empowered damage: +${extra} (count=${count})`);
  } catch (err) {
    log.error("preRollDamage empowerment augment failed", err);
  }
}

async function onPostUseActivity(activity, usageConfig, results) {
  try {
    const item = activity?.item;
    if (item?.type !== "spell" || !isCardItem(item)) return;
    const key = activity.uuid ?? activity.id;
    const count = pending.get(key);
    if (!count) return;
    pending.delete(key);

    const extraSlots = Math.max(0, count - 1);
    if (extraSlots <= 0) return;

    const level = usageConfig?.scaling?.value ?? usageConfig?.spell?.level ?? item.system?.level ?? 0;
    const actor = item.actor;
    if (!actor) return;

    const slotKey = levelToSlotKey(level);
    const slot = foundry.utils.getProperty(actor, `system.spells.${slotKey}`);
    if (!slot) return;
    const current = slot.value ?? 0;
    const next = Math.max(0, current - extraSlots);
    await actor.update({ [`system.spells.${slotKey}.value`]: next });
    log.info(`empowerment consumed ${extraSlots} extra slot(s) at ${slotKey}`);
  } catch (err) {
    log.error("postUseActivity empowerment slot deduction failed", err);
  }
}

function levelToSlotKey(level) {
  return `spell${Math.max(1, Math.min(9, Number(level) || 1))}`;
}
