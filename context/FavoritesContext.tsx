// context/FavoritesContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  loadFavorites,
  saveFavorites,
} from '../lib/favorites';

type FavoritesContextValue = {
  favorites: string[];
  loaded: boolean;
  isFavorite: (uri: string) => boolean;
  toggle: (uri: string) => void;
  add: (uri: string) => void;
  remove: (uri: string) => void;
  clear: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadFavorites().then((list) => {
      setFavorites(list);
      setLoaded(true);
    });
  }, []);

  const isFavorite = useCallback(
    (uri: string) => favorites.includes(uri),
    [favorites]
  );

  const add = useCallback((uri: string) => {
    setFavorites((prev) => {
      if (prev.includes(uri)) return prev;
      const next = [...prev, uri];
      saveFavorites(next).catch(() => {});
      return next;
    });
  }, []);

  const remove = useCallback((uri: string) => {
    setFavorites((prev) => {
      const next = prev.filter((u) => u !== uri);
      saveFavorites(next).catch(() => {});
      return next;
    });
  }, []);

  const toggle = useCallback((uri: string) => {
    setFavorites((prev) => {
      const next = prev.includes(uri)
        ? prev.filter((u) => u !== uri)
        : [...prev, uri];
      saveFavorites(next).catch(() => {});
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setFavorites([]);
    saveFavorites([]).catch(() => {});
  }, []);

  const value = useMemo<FavoritesContextValue>(
    () => ({ favorites, loaded, isFavorite, toggle, add, remove, clear }),
    [favorites, loaded, isFavorite, toggle, add, remove, clear]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx)
    throw new Error('useFavorites must be used inside <FavoritesProvider>');
  return ctx;
}