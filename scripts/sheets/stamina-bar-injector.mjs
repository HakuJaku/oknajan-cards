import { MODULE_ID } from "../constants.mjs";
import { readStamina } from "../cards/stamina.mjs";

const TEMPLATE = `modules/${MODULE_ID}/templates/sheets/stamina-bar.hbs`;

export async function injectStaminaBar(app, element) {
  const actor = app.document ?? app.actor ?? app.object;
  if (actor?.type !== "character") return;

  const stamina = readStamina(actor);
  if (!stamina.configured) return;

  const hpMeter = element.querySelector(".meter.hit-points");
  if (!hpMeter) return;

  const percent = stamina.max > 0 ? Math.round((stamina.value / stamina.max) * 100) : 0;
  const rendered = await foundry.applications.handlebars.renderTemplate(TEMPLATE, {
    stamina: { ...stamina, percent, isLow: percent <= 25 }
  });

  const wrapper = document.createElement("div");
  wrapper.innerHTML = rendered.trim();
  const bar = wrapper.firstElementChild;
  if (!bar) return;

  element.querySelector(".ok-stamina-meter")?.remove();
  hpMeter.after(bar);
}
