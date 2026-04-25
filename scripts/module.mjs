import { MODULE_ID, HOOKS } from "./constants.mjs";
import { log } from "./util/log.mjs";
import { registerSettings } from "./settings.mjs";
import { registerHandlebarsHelpers } from "./util/handlebars-helpers.mjs";
import { injectSpellSheet } from "./sheets/spell-sheet-injector.mjs";
import { injectFeatSheet } from "./sheets/feat-sheet-injector.mjs";
import { preCreateItemDefaults } from "./flags/preCreateDefaults.mjs";
import { CARD_TEMPLATE_PATHS, injectCardsTab } from "./cards/cards-tab.mjs";
import { injectStaminaBar } from "./sheets/stamina-bar-injector.mjs";
import { queueActorSheetRender } from "./util/render-queue.mjs";
import { registerActivityTracker } from "./hooks/activity-tracker.mjs";
import { registerProgression } from "./hooks/progression.mjs";
import { registerStaminaHooks } from "./hooks/stamina-hooks.mjs";
import { registerEmpowermentHooks } from "./hooks/empowerment-hooks.mjs";
import { registerRefundWrapper } from "./hooks/refund-wrapper.mjs";

const MODULE_TEMPLATE_PATHS = Object.freeze([
  ...CARD_TEMPLATE_PATHS,
  `modules/${MODULE_ID}/templates/sheets/stamina-bar.hbs`,
  `modules/${MODULE_ID}/templates/dialogs/empowerment.hbs`,
  `modules/${MODULE_ID}/templates/dialogs/initialise-stamina.hbs`,
  `modules/${MODULE_ID}/templates/dialogs/modify-spell.hbs`,
  `modules/${MODULE_ID}/templates/dialogs/stamina-confirm.hbs`,
  `modules/${MODULE_ID}/templates/sheets/spell-card-section.hbs`,
  `modules/${MODULE_ID}/templates/sheets/technique-card-section.hbs`
]);

Hooks.once("init", () => {
  log.info("init");
  registerSettings();
  registerHandlebarsHelpers();
  void preloadTemplates();
});

Hooks.once("ready", () => {
  log.info("ready");
  verifyPreRollDamageHook();
  registerActivityTracker();
  registerProgression();
  registerStaminaHooks();
  registerEmpowermentHooks();
  registerRefundWrapper();
});

// Phase 3 — item-sheet injection router and flag-default pre-create handler
Hooks.on(HOOKS.renderItemSheet, async (app, element, context, options) => {
  const type = (app.document ?? app.item ?? app.object)?.type;
  try {
    if (type === "spell") await injectSpellSheet(app, element, context, options);
    else if (type === "feat") await injectFeatSheet(app, element, context, options);
  } catch (err) {
    log.error("injector failed", err);
  }
});

Hooks.on(HOOKS.preCreateItem, preCreateItemDefaults);

/**
 * RV1 verification — fires a short-lived listener on the presumed pre-damage
 * roll hook. If the hook never fires, log a warning so the user knows to
 * correct the name in §4.
 */
function verifyPreRollDamageHook() {
  const id = Hooks.on(HOOKS.preRollDamage, () => {
    log.info(`RV1 confirmed: '${HOOKS.preRollDamage}' fires.`);
    Hooks.off(HOOKS.preRollDamage, id);
  });
  // No teardown timer — the first damage roll of the session confirms or the user never sees the log.
}

// Phase 4 — Cards tab injection on the character sheet, and debounced
// re-render triggers on stamina and owned-item changes.
Hooks.on(HOOKS.renderCharacterSheet, async (app, element, context, options) => {
  await injectCardsTab(app, element, context, options);
  await injectStaminaBar(app, element);
});

Hooks.on(HOOKS.updateActor, async (actor, changes) => {
  if (foundry.utils.hasProperty(changes, "system.resources.tertiary")) {
    queueActorSheetRender(actor);
  }
  if (foundry.utils.hasProperty(changes, "system.abilities.con")) {
    const { recalculateStaminaMax } = await import("./cards/stamina.mjs");
    await recalculateStaminaMax(actor);
  }
});

const reRenderIfOwnedByActor = item => { if (item.actor) queueActorSheetRender(item.actor); };
Hooks.on(HOOKS.createItem, reRenderIfOwnedByActor);
Hooks.on(HOOKS.updateItem, reRenderIfOwnedByActor);
Hooks.on(HOOKS.deleteItem, reRenderIfOwnedByActor);

// Phase 5 hooks are registered inside the primary `ready` block above.

async function preloadTemplates() {
  const loadTemplatesFn = foundry.applications?.handlebars?.loadTemplates ?? globalThis.loadTemplates;
  if (!loadTemplatesFn) {
    log.warn("template preload skipped: no loadTemplates API available");
    return;
  }

  try {
    await loadTemplatesFn(MODULE_TEMPLATE_PATHS);
  } catch (err) {
    log.error("template preload failed", err);
  }
}
