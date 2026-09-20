// hooks/useSettings.ts
// Re-export settings state from ThemeContext.
// The context owns the state; this hook is a thin alias so existing
// imports like `import { useSettings } from '../../hooks/useSettings'`
// keep working without duplicating state.
export { useSettings, useTheme } from '../context/ThemeContext';