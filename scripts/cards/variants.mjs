import {
  MODULE_ID,
  FLAG_NAMESPACE,
  STAMINA_CONSUMPTION_TARGET_TYPE,
  STAMINA_CONSUMPTION_TARGET_PATH
} from "../constants.mjs";
import { defaultSpellFlags } from "../flags/defaults.mjs";
import { log } from "../util/log.mjs";

const MODIFY_DIALOG_TEMPLATE = `modules/${MODULE_ID}/templates/dialogs/modify-spell.hbs`;

/**
 * Automatic ultimate technique creation at tier 3.
 * @param {Item} parentItem
 */
export async function generateUltimateTechnique(parentItem) {
  const actor = parentItem.actor;
  if (!actor) return;

  const existing = actor.items.find(i =>
    i.flags?.[FLAG_NAMESPACE]?.isUltimate === true
    && i.flags?.[FLAG_NAMESPACE]?.parentItemId === parentItem.id
  );
  if (existing) return;

  const parentFlags = parentItem.flags[FLAG_NAMESPACE];
  const cfg = parentFlags.techniqueConfig ?? {};
  const { ultimateName, ultimateDescription, ultimateImg, ultimateStaminaCost = 0 } = cfg;

  const sys = foundry.utils.deepClone(parentItem.toObject().system);
  if (sys.description) sys.description.value = ultimateDescription || sys.description.value;

  if (sys.activities) {
    const ids = Object.keys(sys.activities);
    if (ids.length) {
      const [firstId] = ids;
      const act = sys.activities[firstId];
      act.consumption ??= { targets: [] };
      act.consumption.targets = (act.consumption.targets ?? []).filter(t =>
        !(t.type === STAMINA_CONSUMPTION_TARGET_TYPE && t.target === STAMINA_CONSUMPTION_TARGET_PATH)
      );
      if (ultimateStaminaCost > 0) {
        act.consumption.targets.push({
          type: STAMINA_CONSUMPTION_TARGET_TYPE,
          target: STAMINA_CONSUMPTION_TARGET_PATH,
          value: String(ultimateStaminaCost)
        });
      }
    }
  }

  const payload = {
    name: ultimateName || `${parentItem.name} ${game.i18n.localize("OKNAJAN.variants.ultimateSuffix")}`,
    img: ultimateImg || parentItem.img,
    type: "feat",
    system: sys,
    flags: {
      [FLAG_NAMESPACE]: {
        isCard: true,
        contentType: "technique",
        activationCount: 0,
        progressionTier: 0,
        parentItemId: parentItem.id,
        isModifiedVariant: false,
        isUltimate: true,
        foilUnlocked: true,
        staminaCost: ultimateStaminaCost,
        spellConfig: null,
        techniqueConfig: foundry.utils.deepClone(cfg)
      }
    }
  };

  await actor.createEmbeddedDocuments("Item", [payload]);
  log.info(`created ultimate technique for ${parentItem.name}`);
}

/**
 * User-triggered modified spell creation at tier 3.
 * @param {Actor} actor
 * @param {Item} parentItem
 */
export async function openModifySpellDialog(actor, parentItem) {
  const initial = {
    name: `${parentItem.name} ${game.i18n.localize("OKNAJAN.variants.modifiedSuffix")}`,
    description: parentItem.system?.description?.value ?? ""
  };
  const content = await foundry.applications.handlebars.renderTemplate(MODIFY_DIALOG_TEMPLATE, initial);

  return new Promise(resolve => {
    new Dialog({
      title: game.i18n.localize("OKNAJAN.dialogs.modifySpell.title"),
      content,
      buttons: {
        confirm: {
          label: game.i18n.localize("OKNAJAN.dialogs.confirm"),
          callback: async html => {
            const root = html instanceof HTMLElement ? html : html[0];
            const name = root.querySelector('[name="ok-name"]').value;
            const desc = root.querySelector('[name="ok-desc"]').value;
            await createModifiedSpell(actor, parentItem, { name, description: desc });
            resolve(true);
          }
        },
        cancel: {
          label: game.i18n.localize("OKNAJAN.dialogs.cancel"),
          callback: () => resolve(false)
        }
      },
      default: "confirm"
    }).render(true);
  });
}

async function createModifiedSpell(actor, parentItem, { name, description }) {
  const sys = foundry.utils.deepClone(parentItem.toObject().system);
  if (sys.description) sys.description.value = description;

  const defaults = defaultSpellFlags();
  const payload = {
    name,
    img: parentItem.img,
    type: "spell",
    system: sys,
    flags: {
      [FLAG_NAMESPACE]: {
        ...defaults,
        isModifiedVariant: true,
        parentItemId: parentItem.id,
        foilUnlocked: true,
        spellConfig: { ...defaults.spellConfig, tier3Threshold: null }
      }
    }
  };
  await actor.createEmbeddedDocuments("Item", [payload]);
  log.info(`created modified spell from ${parentItem.name}`);
}
