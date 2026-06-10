/** Skip pull-to-refresh when the user interacts with controls inside a scroll area. */
export function isInteractiveTouchTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "button, a, input, textarea, select, label, [role='button'], [data-no-pull]"
    )
  );
}
