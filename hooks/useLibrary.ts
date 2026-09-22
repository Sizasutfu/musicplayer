// hooks/useLibrary.ts
// Re-export from context so existing imports keep working.
// The single source of truth lives in context/LibraryContext.tsx.
export { useLibrary } from '../context/LibraryContext';
export type { Song } from '../context/LibraryContext';