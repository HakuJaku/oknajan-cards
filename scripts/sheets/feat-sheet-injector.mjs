import { MODULE_ID, FLAG_NAMESPACE } from "../constants.mjs";
import { defaultTechniqueFlags } from "../flags/defaults.mjs";
import { readFlagsForRender, insertOknajanTab } from "./item-sheet-common.mjs";
import { syncTechniqueConsumptionTarget } from "../util/stamina-sync.mjs";

const TEMPLATE = `modules/${MODULE_ID}/templates/sheets/technique-card-section.hbs`;

export async function injectFeatSheet(app, element, context, options) {
  const item = app.document ?? app.item ?? app.object;
  if (item?.type !== "feat") return;

  const flags = readFlagsForRender(item);
  const activationType = item.system?.activation?.type;
  const isPassive = !activationType || activationType === "none" || activationType === "";

  const rendered = await foundry.applications.handlebars.renderTemplate(TEMPLATE, { flags, isPassive });
  insertOknajanTab(app, element, rendered);

  // Toggle-on default writer
  const toggleEl = element.querySelector('input[name="flags.oknajan-cards.isCard"]');
  if (toggleEl) {
    toggleEl.addEventListener("change", async ev => {
      const checked = ev.currentTarget.checked;
      if (checked && !item.getFlag(FLAG_NAMESPACE, "contentType")) {
        await item.update({ [`flags.${FLAG_NAMESPACE}`]: defaultTechniqueFlags(activationType) });
      }
    });
  }

  // Stamina cost → consumption-target sync on change
  const costEl = element.querySelector('input[name="flags.oknajan-cards.staminaCost"]');
  if (costEl) {
    costEl.addEventListener("change", async ev => {
      const cost = Number(ev.currentTarget.value) || 0;
      await syncTechniqueConsumptionTarget(item, cost);
    });
  }
}
