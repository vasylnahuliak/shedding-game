import { useLocalSearchParams } from 'expo-router';

import { appRoutes } from '@/navigation/appRoutes';
import { useModalDismiss } from '@/navigation/useModalDismiss';

export const useGameModalDismiss = () => {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();

  return useModalDismiss(roomId ? appRoutes.game({ roomId }) : appRoutes.home);
};
