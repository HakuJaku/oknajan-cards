import { MODULE_ID, SETTINGS } from "../constants.mjs";
import { buildTabContext } from "./card-renderer.mjs";
import { log } from "../util/log.mjs";

const TAB_TEMPLATE = `modules/${MODULE_ID}/templates/cards/cards-tab.hbs`;
export const CARD_TEMPLATE_PATHS = Object.freeze([
  TAB_TEMPLATE,
  `modules/${MODULE_ID}/templates/cards/stamina-header.hbs`,
  `modules/${MODULE_ID}/templates/cards/spell-card.hbs`,
  `modules/${MODULE_ID}/templates/cards/technique-card.hbs`
]);

export async function injectCardsTab(app, element, context, options) {
  if (!game.settings.get(MODULE_ID, SETTINGS.showCardsTab)) return;

  const actor = app.document ?? app.actor ?? app.object;
  if (actor?.type !== "character") return;

  try {
    await ensureCardsTemplatesRegistered();
    const ctx = buildTabContext(actor);
    const rendered = await foundry.applications.handlebars.renderTemplate(TAB_TEMPLATE, ctx);

    // Locate the primary nav by finding any existing primary-group anchor and
    // climbing to its parent nav. The nav itself has no data-group attribute.
    const navAnchor = element.querySelector('a[data-action="tab"][data-group="primary"]');
    const nav = navAnchor?.closest("nav");
    if (!nav) {
      log.warn("injectCardsTab: no primary tab nav found; cannot inject");
      return;
    }

    const isActive = app?.tabGroups?.primary === "oknajan-cards";
    const tooltipLabel = game.i18n.localize("OKNAJAN.cards.tabLabel");

    // The character sheet sidebar nav uses icon-only anchors with tooltips
    // (see dnd5e templates/shared/sidebar-tabs.hbs). Match that style.
    let trigger = nav.querySelector('a[data-tab="oknajan-cards"][data-group="primary"]');
    if (!trigger) {
      trigger = document.createElement("a");
      trigger.setAttribute("data-action", "tab");
      trigger.setAttribute("data-group", "primary");
      trigger.setAttribute("data-tab", "oknajan-cards");
      trigger.setAttribute("aria-label", tooltipLabel);
      trigger.setAttribute("data-tooltip", tooltipLabel);
      trigger.innerHTML = '<i class="fa-solid fa-cards" inert></i>';
      nav.appendChild(trigger);
    }
    trigger.className = "item control ok-tab-trigger" + (isActive ? " active" : "");

    // Character sheet PARTS share a `<div class="tab-body" id="tabs">` parent
    // via AppV2 `container: { classes: ["tab-body"], id: "tabs" }`. Put our
    // section inside it so it is a sibling of the native tab content parts
    // and AppV2's tab controller toggles `.active` on it during tab switches.
    const bodyHost = element.querySelector(".tab-body")
      ?? element.querySelector('[data-application-part="tabs"]')?.parentElement
      ?? element.querySelector(".window-content")
      ?? element.querySelector("form")
      ?? element;

    const prior = bodyHost.querySelector(
      ':scope > section[data-tab="oknajan-cards"][data-group="primary"]'
    );
    prior?.remove();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = rendered.trim();
    const section = wrapper.firstElementChild;
    if (!section) return;
    if (isActive) section.classList.add("active");
    bodyHost.appendChild(section);

    // Delegated handlers (attached fresh each render since the section is
    // replaced each time).
    wireCardHandlers(actor, section);
  } catch (err) {
    log.error("cards tab injection failed", err);
  }
}

function wireCardHandlers(actor, root) {
  if (!root) return;

  root.addEventListener("click", async ev => {
    const useBtn = ev.target.closest(".ok-card-use");
    const modifyBtn = ev.target.closest(".ok-card-modify");
    const initBtn = ev.target.closest(".ok-stamina-init");

    if (useBtn) {
      ev.preventDefault();
      const itemId = useBtn.dataset.itemId;
      const item = actor.items.get(itemId);
      if (!item) return;
      // Prefer activity.use if available; fall back to item.use.
      const activities = item.system?.activities;
      const entries = activities?.entries ? Array.from(activities.entries()) : Object.entries(activities ?? {});
      const [, firstActivity] = entries[0] ?? [];
      if (firstActivity?.use) await firstActivity.use();
      else if (item.use) await item.use();
      return;
    }

    if (modifyBtn) {
      ev.preventDefault();
      const itemId = modifyBtn.dataset.itemId;
      const item = actor.items.get(itemId);
      if (!item) return;
      const { openModifySpellDialog } = await import("./variants.mjs");
      await openModifySpellDialog(actor, item);
      return;
    }

    if (initBtn) {
      ev.preventDefault();
      const { initialiseStaminaPool } = await import("./stamina.mjs");
      await initialiseStaminaPool(actor);
      return;
    }
  });
}

async function ensureCardsTemplatesRegistered() {
  const getTemplateFn = foundry.applications?.handlebars?.getTemplate ?? globalThis.getTemplate;
  if (!getTemplateFn) {
    log.warn("injectCardsTab: no getTemplate API available; cannot pre-register partials");
    return;
  }

  for (const path of CARD_TEMPLATE_PATHS) {
    if (path in Handlebars.partials) continue;
    try {
      await getTemplateFn(path);
    } catch (err) {
      log.error(`injectCardsTab: failed to register template ${path}`, err);
      throw err;
    }
  }
}
