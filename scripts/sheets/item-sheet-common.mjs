import { MODULE_ID, FLAG_NAMESPACE } from "../constants.mjs";
import { log } from "../util/log.mjs";

/**
 * Read flags with safe defaults for rendering. Does NOT mutate the item.
 *
 * We read `item.flags[FLAG_NAMESPACE]` directly rather than via `getFlag`.
 * `Document.getFlag(scope, key)` delegates to `foundry.utils.getProperty`,
 * which short-circuits and returns `undefined` when `key` is empty — so
 * `getFlag(ns, "")` always returns `undefined`, which would un-tick the
 * "Treat as card" checkbox on every re-render.
 */
export function readFlagsForRender(item) {
  const raw = item?.flags?.[FLAG_NAMESPACE] ?? {};
  return {
    isCard: !!raw.isCard,
    contentType: raw.contentType ?? null,
    activationCount: raw.activationCount ?? 0,
    progressionTier: raw.progressionTier ?? 0,
    parentItemId: raw.parentItemId ?? null,
    isModifiedVariant: !!raw.isModifiedVariant,
    isUltimate: !!raw.isUltimate,
    foilUnlocked: !!raw.foilUnlocked,
    staminaCost: raw.staminaCost ?? 0,
    spellConfig: raw.spellConfig ?? null,
    techniqueConfig: raw.techniqueConfig ?? null
  };
}

/**
 * Insert an Oknajan tab nav item and tab section into an AppV2 item sheet.
 * The native AppV2 tab controller handles switching via data-action="tab".
 *
 * dnd5e 5.x renders the tab nav from Foundry core's
 * templates/generic/tab-navigation.hbs as `<nav class="sheet-tabs tabs …">`.
 * The `data-group` attribute lives on the child anchors, not on the nav.
 * Each tab content section is inside its own `[data-application-part]`
 * container as a direct child of the sheet form. We place the Oknajan
 * section as a sibling of those part containers so AppV2's tab controller
 * (which queries `.tab[data-group="primary"]` across `#content`) finds it.
 *
 * @param {ApplicationV2} app    The sheet app (for tabGroups state)
 * @param {HTMLElement} element  Sheet root element (AppV2 passes raw HTMLElement)
 * @param {string} bodyHtml      Fully rendered HTML for the tab body
 */
export function insertOknajanTab(app, element, bodyHtml) {
  // Locate the primary nav by finding any existing primary-group tab anchor
  // and climbing to its parent nav.
  const firstAnchor = element.querySelector('a[data-action="tab"][data-group="primary"]');
  const nav = firstAnchor?.closest("nav");
  if (!nav) {
    log.warn("insertOknajanTab: no primary tab nav found; cannot inject");
    return;
  }

  const activeTab = app?.tabGroups?.primary;
  const isActive = activeTab === "oknajan";

  // Nav anchor — add if missing; always refresh its active class.
  let trigger = nav.querySelector('a[data-tab="oknajan"][data-group="primary"]');
  if (!trigger) {
    trigger = document.createElement("a");
    trigger.setAttribute("data-action", "tab");
    trigger.setAttribute("data-group", "primary");
    trigger.setAttribute("data-tab", "oknajan");
    trigger.setAttribute("aria-label", game.i18n.localize("OKNAJAN.ariaLabels.oknajanTab"));
    trigger.innerHTML = '<i class="fa-solid fa-cards" inert></i><span>'
      + game.i18n.localize("OKNAJAN.ariaLabels.oknajanTab") + "</span>";
    nav.appendChild(trigger);
  }
  trigger.className = "item control ok-tab-trigger" + (isActive ? " active" : "");

  // Tab section host — sibling of the part containers.
  const tabsPart = element.querySelector('[data-application-part="tabs"]');
  const bodyHost = tabsPart?.parentElement
    ?? element.querySelector(".window-content")
    ?? element.querySelector("form")
    ?? element;

  // Rip out any prior injection so the new markup reflects the latest render.
  const prior = bodyHost.querySelector(
    ':scope > section[data-tab="oknajan"][data-group="primary"]'
  );
  prior?.remove();

  const wrapper = document.createElement("div");
  wrapper.innerHTML = bodyHtml.trim();
  const section = wrapper.firstElementChild;
  if (!section) return;
  if (isActive) section.classList.add("active");

  bodyHost.appendChild(section);
}
