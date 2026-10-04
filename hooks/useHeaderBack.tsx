// hooks/useHeaderBack.ts
import { useLayoutEffect } from 'react';
import { useNavigation } from 'expo-router';
import BackButton from '../components/BackButton';

/**
 * Replaces the drawer's hamburger with a back button on this screen.
 * Optionally sets the header title.
 *
 * Only works on screens that use the navigator header. Screens with
 * `headerShown: false` (like Library) should render <BackButton />
 * inside their own title row instead.
 */
export function useHeaderBack(title?: string) {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      ...(title ? { title } : {}),
      headerLeft: () => <BackButton />,
    });
  }, [navigation, title]);
}