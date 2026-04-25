import { FLAG_NAMESPACE } from "../constants.mjs";
import { defaultSpellFlags, defaultTechniqueFlags } from "./defaults.mjs";

/**
 * Fill missing flag defaults on items that already have isCard === true at
 * creation time (e.g. items dragged from a compendium or created by a macro).
 * Called on the preCreateItem hook.
 */
export function preCreateItemDefaults(document, data, options, userId) {
  const incoming = data.flags?.[FLAG_NAMESPACE];
  if (incoming?.isCard !== true) return;
  if (incoming.contentType) return; // already populated

  const type = data.type;
  const base = type === "spell"
    ? defaultSpellFlags()
    : type === "feat"
      ? defaultTechniqueFlags(data.system?.activation?.type ?? null)
      : null;
  if (!base) return;

  const merged = foundry.utils.mergeObject(base, incoming, { inplace: false });
  document.updateSource({ [`flags.${FLAG_NAMESPACE}`]: merged });
}
