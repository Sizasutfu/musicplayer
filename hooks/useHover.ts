// hooks/useHover.ts
import { useState } from 'react';
import { Platform } from 'react-native';

/**
 * Web-only hover state. Returns an empty prop bag on native so
 * spread-sites are safe everywhere, and the `hovered` flag stays
 * false so conditional styles never trigger.
 *
 * The `any` cast is because Pressable's react-native type
 * definition doesn't know about onHoverIn / onHoverOut — those are
 * React Native Web extensions. The props are ignored on native.
 */
export function useHover() {
  const [hovered, setHovered] = useState(false);

  const hoverProps =
    Platform.OS === 'web'
      ? ({
          onHoverIn: () => setHovered(true),
          onHoverOut: () => setHovered(false),
        } as any)
      : {};

  return { hovered, hoverProps };
}