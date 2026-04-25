const pending = new Map();

export function queueActorSheetRender(actor, delay = 50) {
  if (!actor?.id) return;
  const prev = pending.get(actor.id);
  if (prev) clearTimeout(prev);
  const handle = setTimeout(() => {
    pending.delete(actor.id);
    for (const app of Object.values(actor.apps ?? {})) {
      if (app?.rendered) app.render(false);
    }
  }, delay);
  pending.set(actor.id, handle);
}
