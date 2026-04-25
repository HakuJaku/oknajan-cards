import { MODULE_ID, FLAG_NAMESPACE } from "../constants.mjs";
import { defaultSpellFlags } from "../flags/defaults.mjs";
import { readFlagsForRender, insertOknajanTab } from "./item-sheet-common.mjs";

const TEMPLATE = `modules/${MODULE_ID}/templates/sheets/spell-card-section.hbs`;

export async function injectSpellSheet(app, element, context, options) {
  const item = app.document ?? app.item ?? app.object;
  if (item?.type !== "spell") return;

  const flags = readFlagsForRender(item);
  const rendered = await foundry.applications.handlebars.renderTemplate(TEMPLATE, { flags });
  insertOknajanTab(app, element, rendered);

  // Toggle-on default writer
  const toggleEl = element.querySelector('input[name="flags.oknajan-cards.isCard"]');
  if (toggleEl) {
    toggleEl.addEventListener("change", async ev => {
      const checked = ev.currentTarget.checked;
      if (checked && !item.getFlag(FLAG_NAMESPACE, "contentType")) {
        await item.update({ [`flags.${FLAG_NAMESPACE}`]: defaultSpellFlags() });
      }
    });
  }
}
