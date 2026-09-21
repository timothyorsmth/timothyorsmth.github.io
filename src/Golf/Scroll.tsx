/** Converts a container-relative Y coordinate (e.g. the ball's position) to an absolute page Y coordinate. */
export function toAbsoluteY(container: HTMLElement, relativeY: number): number {
  return container.getBoundingClientRect().top + window.scrollY + relativeY;
}

/**
 * Scrolls the window so `absoluteY` (a page Y coordinate) sits vertically
 * centered in the viewport, clamped to the page's actual scrollable range
 * so it never overscrolls past the top or bottom.
 */
export function centerViewportOn(absoluteY: number) {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const target = Math.max(0, Math.min(maxScroll, absoluteY - window.innerHeight / 2));
  window.scrollTo({ top: target, left: window.scrollX });
}