/* A regular button that can also be activated by a ball hitting its visible bounds. */
import { useEffect, useId, useRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { useGolfContext } from './useGolfContext';

export function GolfButton({ disabled, type = 'button', ...props }: ComponentPropsWithoutRef<'button'>) {
  const id = useId();
  const ref = useRef<HTMLButtonElement>(null);
  const { registerObstacle, unregisterObstacle } = useGolfContext();

  useEffect(() => {
    const button = ref.current;
    if (!button || disabled) return;
    registerObstacle(id, 'trigger', button, () => button.click());
    return () => unregisterObstacle(id);
  }, [id, disabled, registerObstacle, unregisterObstacle]);

  return <button {...props} ref={ref} type={type} disabled={disabled} />;
}
