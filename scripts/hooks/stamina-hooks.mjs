import { MODULE_ID, FLAG_NAMESPACE, SETTINGS, HOOKS } from "../constants.mjs";
import { readStamina } from "../cards/stamina.mjs";
import { log } from "../util/log.mjs";

const CONFIRM_TEMPLATE = `modules/${MODULE_ID}/templates/dialogs/stamina-confirm.hbs`;

export function registerStaminaHooks() {
  Hooks.on(HOOKS.preConsume, async (activity, usageConfig, messageConfig) => {
    try {
      const item = activity?.item;
      if (item?.type !== "feat") return true;
      const flags = item.flags?.[FLAG_NAMESPACE];
      if (!flags?.isCard) return true;
      const cost = flags.staminaCost ?? 0;
      if (cost <= 0) return true;
      if (!game.settings.get(MODULE_ID, SETTINGS.confirmStamina)) return true;

      const stamina = readStamina(item.actor);
      const content = await foundry.applications.handlebars.renderTemplate(CONFIRM_TEMPLATE, {
        itemName: item.name,
        cost,
        stamina
      });
      const proceed = await Dialog.confirm({
        title: game.i18n.localize("OKNAJAN.dialogs.confirmStamina.title"),
        content,
        defaultYes: true
      });
      if (proceed === false || proceed === null) return false;
      return true;
    } catch (err) {
      log.error("stamina confirm failed", err);
      return true;
    }
  });
}
