/* A normal accessible link whose actual DOM bounds also act as a golf trigger. */
import { useEffect, useId, useRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { useGolfContext } from './useGolfContext';

export function GolfLink(props: ComponentPropsWithoutRef<'a'>) {
  const ref = useRef<HTMLAnchorElement>(null);
  const id = useId();
  const { registerObstacle, unregisterObstacle } = useGolfContext();
  const disabled = props['aria-disabled'] === true || props['aria-disabled'] === 'true';

  useEffect(() => {
    const link = ref.current;
    if (!link || !props.href || disabled) return;
    // Use the same action as pointer/keyboard activation, including existing click handlers.
    registerObstacle(id, 'trigger', link, () => link.click());
    return () => unregisterObstacle(id);
  }, [id, props.href, disabled, registerObstacle, unregisterObstacle]);

  return <a {...props} ref={ref} />;
}
