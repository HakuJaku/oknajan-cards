/**
 * Shared constants for Oknajan Cards.
 * Hook names are validated in claude.md §6. Any name marked VERIFY must be
 * confirmed at module init via a console listener and recorded in §4.
 */

export const MODULE_ID = "oknajan-cards";
export const FLAG_NAMESPACE = "oknajan-cards";

// Actor-side stamina contract
export const STAMINA_RESOURCE_PATH = "system.resources.tertiary";
export const STAMINA_CONSUMPTION_TARGET_TYPE = "attribute";
export const STAMINA_CONSUMPTION_TARGET_PATH = "resources.tertiary.value";
export const STAMINA_LABEL = "Stamina";

// Hook names (validated in §6 unless marked VERIFY)
export const HOOKS = Object.freeze({
  // Core Foundry
  init: "init",
  ready: "ready",
  preCreateItem: "preCreateItem",
  createItem: "createItem",
  updateItem: "updateItem",
  deleteItem: "deleteItem",
  updateActor: "updateActor",
  updateChatMessage: "updateChatMessage",

  // dnd5e sheet render hooks (validated from dnd5e.mjs registration)
  renderItemSheet: "renderItemSheet5e",
  renderCharacterSheet: "renderCharacterActorSheet",

  // dnd5e activity consumption (validated from mixin.mjs)
  preUseActivity: "dnd5e.preUseActivity",
  preConsume: "dnd5e.preActivityConsumption",
  consume: "dnd5e.activityConsumption",
  postConsume: "dnd5e.postActivityConsumption",
  postUseActivity: "dnd5e.postUseActivity",

  // dnd5e damage rolls
  preRollDamage: "dnd5e.preRollDamageV2",  // VERIFY at init — see §4 RV1
  rollDamage: "dnd5e.rollDamage",
  rollDamageV2: "dnd5e.rollDamageV2"
});

// Module settings keys
export const SETTINGS = Object.freeze({
  recoveryPolicy: "recoveryPolicy",       // "short" | "long" | "both" | "neither"
  staminaMaxFormula: "staminaMaxFormula", // default "3 + @abilities.con.mod"
  confirmStamina: "confirmStamina",       // boolean
  showCardsTab: "showCardsTab"            // boolean
});

// Default values
export const DEFAULTS = Object.freeze({
  spellT1: 5,
  spellT2: 15,
  spellT3: 30,
  techniqueT1: 5,
  techniqueT2: 15,
  techniqueT3: 30,
  empowermentCap: 3,
  staminaMaxFormula: "3 + @abilities.con.mod",
  recoveryPolicy: "long"
});
