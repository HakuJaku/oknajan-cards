import { FLAG_NAMESPACE, HOOKS } from "../constants.mjs";
import { isCardItem } from "../cards/card-renderer.mjs";
import { evaluateSpellProgression } from "../cards/spell-logic.mjs";
import { evaluateTechniqueProgression } from "../cards/technique-logic.mjs";
import { log } from "../util/log.mjs";

export function registerProgression() {
  Hooks.on(HOOKS.updateItem, async (item, changes) => {
    try {
      if (!isCardItem(item)) return;
      if (!foundry.utils.hasProperty(changes, `flags.${FLAG_NAMESPACE}.activationCount`)) return;
      const flags = item.flags[FLAG_NAMESPACE];
      if (flags.contentType === "spell") await evaluateSpellProgression(item);
      else if (flags.contentType === "technique") await evaluateTechniqueProgression(item);
    } catch (err) {
      log.error("progression eval failed", err);
    }
  });
}
