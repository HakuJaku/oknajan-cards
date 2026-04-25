# Oknajan Cards

Card-based spell and technique progression for D&D 5e on Foundry VTT, with a character-level stamina system.

![screenshot placeholder](./ui/screenshot-placeholder.png)

## What it does

Oknajan Cards turns selected spells and feats into visual, progressing cards on a new **Cards** tab on the character sheet. Each card tracks activation counts, unlocks tiered benefits, and — for techniques — consumes from a character-level **stamina pool** via the native dnd5e activity consumption pipeline.

- **Spells** earn component-mastery striking-through at tier 1, in-dialog empowerment (extra damage dice per additional spell slot) at tier 2, and a user-driven "Modify spell" button at tier 3 that clones the spell into a modified variant.
- **Techniques** gain authored tier-1 and tier-2 benefit text, and automatically spawn an **ultimate** variant on reaching tier 3.
- **Stamina** is stored on `actor.system.resources.tertiary` and recovers on long rest by default. Recovery policy is world-configurable.

## Compatibility

- **Foundry VTT:** v13.347 or later (verified v14)
- **System:** dnd5e 5.0.0 or later (validated against 5.3.2)

## Installation

### Foundry Package Browser

Once published, search for **Oknajan Cards** in Foundry's Module Management browser.

### Manifest URL

Paste the manifest URL into Foundry's **Install Module → Manifest URL** field:

```
https://raw.githubusercontent.com/HakuJaku/oknajan-cards/refs/heads/main/module.json
```

### Manual

Download the release zip, extract into `<FoundryData>/Data/modules/oknajan-cards/`, and enable the module in your world's Module Management.

## Authoring cards — the per-item opt-in

Every card is just a native dnd5e **spell** or **feat** item with a flag set.

1. Open the item sheet.
2. Switch to the **Oknajan** tab (added by this module).
3. Tick **"Treat this item as an Oknajan card"**. Defaults are filled in automatically.
4. Adjust tier thresholds, empowerment text, tier benefits, ultimate variant details, and — for techniques with an activation — the **stamina cost**.

Items without the `flags.oknajan-cards.isCard` flag are completely invisible to the module. There is no hidden behaviour on normal dnd5e content.

## The Cards tab

A new **Cards** tab appears on character sheets alongside the native tabs. It shows:

- A **stamina header** — either an *Initialise stamina pool* button, or an `N / M` readout with a bar.
- A **Spells** section listing every card-flagged spell on the actor.
- A **Techniques** section listing every card-flagged feat on the actor.

Each card renders with tier stars, component chips (spells), cost/passive chips (techniques), benefit text, and a **Use** button for actionable techniques. The Use button is disabled when the actor cannot afford the stamina cost.

Spells also remain visible on the native **Spells** tab — the Cards tab is additive.

## The stamina system

> ⚠️ The module **reserves `actor.system.resources.tertiary`** for its stamina pool. If you are already using that resource slot for something else, do not enable Oknajan's stamina features on that character.

**Initialising:** click *Initialise stamina pool* in the Cards tab. The module rolls the configured formula (default `3 + @abilities.con.mod`) using the actor's roll data, writes the result to `value` and `max`, sets `label` to `"Stamina"`, and applies the world's `sr`/`lr` rest flags.

**Spending:** using a card technique with a stamina cost triggers the native dnd5e activity consumption pipeline against `resources.tertiary.value`. A confirmation dialog appears by default (toggleable in settings). Insufficient stamina raises a dnd5e `ConsumptionError` and the activity aborts.

**Recovery:** dnd5e's native rest pipeline handles recovery via the `sr`/`lr` flags written at initialisation time — no module code runs at rest.

**Refund:** clicking the undo button on a used-technique chat card decrements `activationCount` by one (via a wrapper around `Activity.prototype.refund`, which has no native hook).

## Progression & variants

| Tier | Spells | Techniques |
|---|---|---|
| 0 | plain card | plain card |
| 1 | components you un-tick on the sheet are struck through ("mastered") | tier-1 benefit text appears |
| 2 | empowerment fieldset appears in the usage dialog — extra damage dice cost extra spell slots beyond the first | tier-2 benefit text appears |
| 3 | foil treatment; *Modify spell* button clones the spell into a foil, `tier3Threshold: null` variant | foil treatment; an **Ultimate** variant is created automatically as a new foil item on the actor |

Default thresholds are **5 / 15 / 30** activations; each item's thresholds can be authored individually.

## Starter compendium

The module ships two sample packs:

- **Oknajan Sample Spells:** Ember Dart, Binding Veil, Stormcaller
- **Oknajan Sample Techniques:** Breath Control (passive), Swift Step, Ember Fist

Drop them onto a character to see the full flow end-to-end.

Source JSONs live under `packs/<pack-name>/_source/`. To compile them into the LevelDB packs Foundry ships:

```sh
npm i -g @foundryvtt/foundryvtt-cli
fvtt package pack --type Module --id oknajan-cards -n oknajan-sample-spells     --in packs/oknajan-sample-spells/_source     --out packs
fvtt package pack --type Module --id oknajan-cards -n oknajan-sample-techniques --in packs/oknajan-sample-techniques/_source --out packs
```

(The CLI nests output by compendium name, so `--out packs` places LevelDB files directly inside `packs/<compendium-name>/`, matching the `path` registered in `module.json`.)

## Module settings

| Setting | Default | Effect |
|---|---|---|
| **Stamina Recovery Policy** | Long rest only | Which rest types refill the stamina pool at initialisation time. |
| **Default Stamina Max Formula** | `3 + @abilities.con.mod` | Formula evaluated against the actor's roll data when initialising the pool. |
| **Confirm Stamina Spend** | on | Show a confirmation dialog before spending stamina on a technique. |
| **Show Cards Tab** | on | Show the Cards tab on character sheets. Disabling hides the tab but preserves all flag data. |

Changing the recovery policy after a character has already initialised stamina does **not** retroactively rewrite that character's `sr`/`lr` flags. Re-initialise the pool to apply a new policy.

## Known v2 candidates

- **OD1** Per-actor recovery overrides.
- **OD2** Automated component-mastery Active Effects (v1 is display-only).
- **OD3** Automated empowerment duration scaling (v1 automates damage only).
- **OD4** Multi-modification cycles for spells.
- **OD5** Recovery-policy propagation to existing actors.

## Bug reports

Open an issue at <https://github.com/><org>/oknajan-cards/issues> with Foundry version, dnd5e version, Oknajan Cards version, steps to reproduce, and any relevant console output (prefixed `oknajan-cards |`).

## Licence

MIT (or as declared in `LICENSE`).
