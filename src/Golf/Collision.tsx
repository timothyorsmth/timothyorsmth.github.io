/* DOM geometry helper: converts viewport rectangles into the shared golf container coordinates. Matter handles collision resolution. */
export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
 
/** Bounding box of `el`, expressed relative to `container` (not the viewport). */
export function getRelativeRect(el: HTMLElement, container: HTMLElement): Rect {
  const elRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const left = elRect.left - containerRect.left;
  const top = elRect.top - containerRect.top;
  return {
    left,
    top,
    right: left + elRect.width,
    bottom: top + elRect.height,
  };
}
