import { DEFAULTS } from "../constants.mjs";

export function defaultSpellFlags() {
  return {
    isCard: true,
    contentType: "spell",
    activationCount: 0,
    progressionTier: 0,
    parentItemId: null,
    isModifiedVariant: false,
    isUltimate: false,
    foilUnlocked: false,
    staminaCost: 0,
    spellConfig: {
      tier1Threshold: DEFAULTS.spellT1,
      tier2Threshold: DEFAULTS.spellT2,
      tier3Threshold: DEFAULTS.spellT3,
      essentialComponents: { vocal: true, somatic: true, material: true },
      empowermentCap: DEFAULTS.empowermentCap,
      empowermentPerSlot: ""
    },
    techniqueConfig: null
  };
}

/**
 * @param {string|null} activationType e.g. "action", "bonus", "reaction", "", "none"
 */
export function defaultTechniqueFlags(activationType) {
  const passive = !activationType || activationType === "none" || activationType === "";
  return {
    isCard: true,
    contentType: "technique",
    activationCount: 0,
    progressionTier: 0,
    parentItemId: null,
    isModifiedVariant: false,
    isUltimate: false,
    foilUnlocked: false,
    staminaCost: passive ? 0 : 1,
    spellConfig: null,
    techniqueConfig: {
      tier1Threshold: DEFAULTS.techniqueT1,
      tier2Threshold: DEFAULTS.techniqueT2,
      tier3Threshold: DEFAULTS.techniqueT3,
      tier1Benefit: "",
      tier2Benefit: "",
      ultimateName: "",
      ultimateDescription: "",
      ultimateImg: null,
      ultimateStaminaCost: passive ? 0 : 1,
      category: "",
      resourceLabel: null
    }
  };
}
