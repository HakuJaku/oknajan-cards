import { FLAG_NAMESPACE } from "../constants.mjs";

export async function evaluateSpellProgression(item) {
  const flags = item.flags[FLAG_NAMESPACE];
  if (!flags) return;
  const count = flags.activationCount ?? 0;
  const { tier1Threshold: t1, tier2Threshold: t2, tier3Threshold: t3 } = flags.spellConfig ?? {};

  let tier = 0;
  if (t3 !== null && t3 !== undefined && count >= t3) tier = 3;
  else if (count >= t2) tier = 2;
  else if (count >= t1) tier = 1;

  if (tier !== flags.progressionTier) {
    const update = { [`flags.${FLAG_NAMESPACE}.progressionTier`]: tier };
    if (tier === 3 && !flags.isModifiedVariant) {
      update[`flags.${FLAG_NAMESPACE}.foilUnlocked`] = true;
    }
    await item.update(update);
  }
}
