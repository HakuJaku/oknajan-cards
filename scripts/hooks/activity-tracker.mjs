import { FLAG_NAMESPACE, HOOKS } from "../constants.mjs";
import { isCardItem } from "../cards/card-renderer.mjs";
import { log } from "../util/log.mjs";

export function registerActivityTracker() {
  Hooks.on(HOOKS.postConsume, async (activity, usageConfig, messageConfig, updates) => {
    try {
      const item = activity?.item;
      if (!isCardItem(item)) return;
      const current = item.getFlag(FLAG_NAMESPACE, "activationCount") ?? 0;
      await item.setFlag(FLAG_NAMESPACE, "activationCount", current + 1);
    } catch (err) {
      log.error("postConsume tracker failed", err);
    }
  });
}
