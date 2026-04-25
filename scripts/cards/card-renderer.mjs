import { FLAG_NAMESPACE } from "../constants.mjs";

export function isCardItem(item) {
  return !!item?.flags?.[FLAG_NAMESPACE]?.isCard;
}

export function buildTabContext(actor) {
  const cards = actor.items.filter(isCardItem).map(item => buildCardViewModel(item, actor));
  const spells = cards.filter(c => c.contentType === "spell");
  const techniques = cards.filter(c => c.contentType === "technique");

  const res = actor.system?.resources?.tertiary ?? {};
  const configured = res.label === "Stamina" && Number.isFinite(res.max);
  const percent = configured && res.max > 0
    ? Math.max(0, Math.min(100, Math.round(100 * (res.value ?? 0) / res.max)))
    : 0;

  return {
    actorId: actor.id,
    spells,
    techniques,
    stamina: {
      configured,
      value: res.value ?? 0,
      max: res.max ?? 0,
      percent
    }
  };
}

function buildCardViewModel(item, actor) {
  const flags = item.flags[FLAG_NAMESPACE];
  const isTechnique = flags.contentType === "technique";
  const isPassive = isTechnique && (!item.system?.activation?.type
                                    || item.system.activation.type === "none"
                                    || item.system.activation.type === "");
  const cost = flags.staminaCost ?? 0;
  const currentStamina = actor.system?.resources?.tertiary?.value ?? 0;
  const affordable = !isTechnique || cost === 0 || currentStamina >= cost;

  const base = {
    id: item.id,
    name: item.name,
    img: item.img,
    contentType: flags.contentType,
    tier: flags.progressionTier ?? 0,
    foil: !!flags.foilUnlocked,
    isUltimate: !!flags.isUltimate,
    isModifiedVariant: !!flags.isModifiedVariant,
    activationCount: flags.activationCount ?? 0
  };

  if (isTechnique) {
    return {
      ...base,
      isPassive,
      cost,
      affordable,
      tier1Benefit: flags.techniqueConfig?.tier1Benefit ?? "",
      tier2Benefit: flags.techniqueConfig?.tier2Benefit ?? "",
      category: flags.techniqueConfig?.category ?? "",
      resourceLabel: flags.techniqueConfig?.resourceLabel ?? ""
    };
  }
  return {
    ...base,
    essentialComponents: flags.spellConfig?.essentialComponents ?? { vocal: true, somatic: true, material: true },
    empowermentCap: flags.spellConfig?.empowermentCap ?? 0,
    empowermentPerSlot: flags.spellConfig?.empowermentPerSlot ?? ""
  };
}
