import { MODULE_ID, SETTINGS, DEFAULTS } from "./constants.mjs";

export function registerSettings() {
  game.settings.register(MODULE_ID, SETTINGS.recoveryPolicy, {
    name: "OKNAJAN.settings.recoveryPolicy.name",
    hint: "OKNAJAN.settings.recoveryPolicy.hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      short: "OKNAJAN.settings.recoveryPolicy.choices.short",
      long: "OKNAJAN.settings.recoveryPolicy.choices.long",
      both: "OKNAJAN.settings.recoveryPolicy.choices.both",
      neither: "OKNAJAN.settings.recoveryPolicy.choices.neither"
    },
    default: DEFAULTS.recoveryPolicy
  });

  game.settings.register(MODULE_ID, SETTINGS.staminaMaxFormula, {
    name: "OKNAJAN.settings.staminaMaxFormula.name",
    hint: "OKNAJAN.settings.staminaMaxFormula.hint",
    scope: "world",
    config: true,
    type: String,
    default: DEFAULTS.staminaMaxFormula
  });

  game.settings.register(MODULE_ID, SETTINGS.confirmStamina, {
    name: "OKNAJAN.settings.confirmStamina.name",
    hint: "OKNAJAN.settings.confirmStamina.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, SETTINGS.showCardsTab, {
    name: "OKNAJAN.settings.showCardsTab.name",
    hint: "OKNAJAN.settings.showCardsTab.hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
}
