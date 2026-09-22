// hooks/useProfile.ts
import { useCallback, useEffect, useState } from 'react';
import {
  type Profile,
  DEFAULT_PROFILE,
  loadProfile,
  saveProfile,
  resetProfile,
} from '../lib/profile';

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadProfile().then((p) => {
      setProfile(p);
      setLoaded(true);
    });
  }, []);

  const update = useCallback(
    <K extends keyof Profile>(key: K, value: Profile[K]) => {
      setProfile((prev) => {
        const next = { ...prev, [key]: value };
        saveProfile(next);
        return next;
      });
    },
    []
  );

  const reset = useCallback(async () => {
    setProfile(DEFAULT_PROFILE);
    await resetProfile();
  }, []);

  return { profile, loaded, update, reset };
}