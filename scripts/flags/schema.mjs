import { FLAG_NAMESPACE } from "../constants.mjs";

/**
 * @typedef {Object} SpellConfig
 * @property {number} tier1Threshold
 * @property {number} tier2Threshold
 * @property {number|null} tier3Threshold
 * @property {{vocal: boolean, somatic: boolean, material: boolean}} essentialComponents
 * @property {number} empowermentCap
 * @property {string} empowermentPerSlot
 */

/**
 * @typedef {Object} TechniqueConfig
 * @property {number} tier1Threshold
 * @property {number} tier2Threshold
 * @property {number} tier3Threshold
 * @property {string} tier1Benefit
 * @property {string} tier2Benefit
 * @property {string} ultimateName
 * @property {string} ultimateDescription
 * @property {string|null} ultimateImg
 * @property {number} ultimateStaminaCost
 * @property {string} category
 * @property {string|null} resourceLabel
 */

/**
 * @typedef {Object} OknajanFlags
 * @property {boolean} isCard
 * @property {"spell"|"technique"} contentType
 * @property {number} activationCount
 * @property {0|1|2|3} progressionTier
 * @property {string|null} parentItemId
 * @property {boolean} isModifiedVariant
 * @property {boolean} isUltimate
 * @property {boolean} foilUnlocked
 * @property {number} staminaCost
 * @property {SpellConfig|null} spellConfig
 * @property {TechniqueConfig|null} techniqueConfig
 */

/**
 * Light validation of a flag block.
 * @param {"spell"|"feat"} itemType
 * @param {Partial<OknajanFlags>} flags
 * @returns {{ok: boolean, errors: string[]}}
 */
export function validateFlags(itemType, flags) {
  const errors = [];
  const f = flags ?? {};
  if (typeof f.isCard !== "boolean") errors.push("isCard must be boolean");
  if (!Number.isInteger(f.activationCount) || f.activationCount < 0) {
    errors.push("activationCount must be a non-negative integer");
  }
  if (![0, 1, 2, 3].includes(f.progressionTier)) {
    errors.push("progressionTier must be 0..3");
  }
  if (!Number.isInteger(f.staminaCost) || f.staminaCost < 0) {
    errors.push("staminaCost must be a non-negative integer");
  }

  if (itemType === "spell") {
    if (f.staminaCost !== 0) errors.push("spells must have staminaCost 0");
    const sc = f.spellConfig;
    if (!sc) errors.push("spellConfig required on spell cards");
    else {
      const { tier1Threshold: t1, tier2Threshold: t2, tier3Threshold: t3 } = sc;
      if (!Number.isInteger(t1) || t1 <= 0) errors.push("spell tier1Threshold must be > 0");
      if (!Number.isInteger(t2) || t2 <= t1) errors.push("spell tier2Threshold must be > tier1Threshold");
      if (t3 !== null && (!Number.isInteger(t3) || t3 <= t2)) {
        errors.push("spell tier3Threshold must be null or > tier2Threshold");
      }
    }
  }
  if (itemType === "feat") {
    const tc = f.techniqueConfig;
    if (!tc) errors.push("techniqueConfig required on technique cards");
    else {
      const { tier1Threshold: t1, tier2Threshold: t2, tier3Threshold: t3, ultimateStaminaCost: ult } = tc;
      if (!Number.isInteger(t1) || t1 <= 0) errors.push("technique tier1Threshold must be > 0");
      if (!Number.isInteger(t2) || t2 <= t1) errors.push("technique tier2Threshold must be > tier1Threshold");
      if (!Number.isInteger(t3) || t3 <= t2) errors.push("technique tier3Threshold must be > tier2Threshold");
      if (!Number.isInteger(ult) || ult < 0) errors.push("ultimateStaminaCost must be a non-negative integer");
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Coerce user inputs into the expected shape and fill gaps with the existing
 * value or a sensible default. Used defensively on save.
 */
export function coerceFlags(itemType, flags) {
  const out = foundry.utils.deepClone(flags ?? {});
  out.activationCount = Math.max(0, Math.floor(Number(out.activationCount) || 0));
  out.progressionTier = Math.min(3, Math.max(0, Math.floor(Number(out.progressionTier) || 0)));
  out.staminaCost = Math.max(0, Math.floor(Number(out.staminaCost) || 0));
  if (itemType === "spell") out.staminaCost = 0;
  return out;
}
