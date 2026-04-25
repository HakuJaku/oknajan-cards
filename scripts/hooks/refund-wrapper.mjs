import { FLAG_NAMESPACE, HOOKS } from "../constants.mjs";
import { isCardItem } from "../cards/card-renderer.mjs";
import { log } from "../util/log.mjs";

/**
 * Activity.prototype.refund fires no hook (§6.3). We wrap it on ready so
 * activationCount decrements when a technique's consumption is undone.
 */
export function registerRefundWrapper() {
  Hooks.once(HOOKS.ready, () => {
    const ActivityBase = resolveActivityBase();
    if (!ActivityBase) {
      log.warn("could not resolve activity base class; refund tracking disabled");
      return;
    }
    const original = ActivityBase.prototype.refund;
    if (typeof original !== "function") {
      log.warn("Activity.prototype.refund missing; refund tracking disabled");
      return;
    }
    if (ActivityBase.prototype.__oknajanRefundWrapped) return;
    ActivityBase.prototype.refund = async function(consumed) {
      const result = await original.call(this, consumed);
      try {
        await handleRefundSideEffect(this);
      } catch (err) {
        log.error("refund side-effect failed", err);
      }
      return result;
    };
    ActivityBase.prototype.__oknajanRefundWrapped = true;
    log.info("activity refund wrapper installed");
  });
}

function resolveActivityBase() {
  const activities = CONFIG.DND5E?.activityTypes ?? CONFIG.DND5E?.activities;
  if (!activities) return null;
  for (const entry of Object.values(activities)) {
    const klass = entry?.documentClass ?? entry;
    let proto = klass?.prototype;
    while (proto) {
      if (Object.prototype.hasOwnProperty.call(proto, "refund")) {
        return proto.constructor;
      }
      proto = Object.getPrototypeOf(proto);
    }
  }
  return null;
}

async function handleRefundSideEffect(activity) {
  const item = activity?.item;
  if (!isCardItem(item)) return;
  const current = item.getFlag(FLAG_NAMESPACE, "activationCount") ?? 0;
  if (current <= 0) return;
  await item.setFlag(FLAG_NAMESPACE, "activationCount", Math.max(0, current - 1));
}
