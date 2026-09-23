/**
 * Lightweight 10-foot navigation.
 *
 * Every focusable surface carries the class `tvf`. Directional input picks the
 * nearest candidate geometrically, so no focus tree has to be maintained and
 * the whole system costs a few hundred bytes at runtime.
 */

export type Direction = "up" | "down" | "left" | "right";

function candidates(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(".tvf")).filter((el) => {
    if (el.hasAttribute("disabled") || el.getAttribute("aria-hidden") === "true") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
}

export function focusFirst() {
  const first = candidates()[0];
  first?.focus({ preventScroll: true });
  first?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
}

export function moveFocus(direction: Direction) {
  const all = candidates();
  if (all.length === 0) return;

  const active = document.activeElement as HTMLElement | null;
  if (!active || !active.classList.contains("tvf")) {
    focusFirst();
    return;
  }

  const from = active.getBoundingClientRect();
  const fx = from.left + from.width / 2;
  const fy = from.top + from.height / 2;

  let best: HTMLElement | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const el of all) {
    if (el === active) continue;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = cx - fx;
    const dy = cy - fy;

    const forward =
      direction === "left"
        ? -dx
        : direction === "right"
          ? dx
          : direction === "up"
            ? -dy
            : dy;
    if (forward <= 8) continue;

    const lateral = direction === "left" || direction === "right" ? Math.abs(dy) : Math.abs(dx);
    const score = forward + lateral * 2.2;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }

  if (best) {
    best.focus({ preventScroll: true });
    best.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }
}

export function activateFocused() {
  const active = document.activeElement as HTMLElement | null;
  if (active && active.classList.contains("tvf")) active.click();
}
