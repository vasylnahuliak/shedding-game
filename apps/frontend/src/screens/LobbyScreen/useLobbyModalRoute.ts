import { useLocalSearchParams } from 'expo-router';

import { useRoomDetailQuery } from '@/api';
import { useAuth } from '@/hooks/useAuthStore';
import { appRoutes } from '@/navigation/appRoutes';
import { useModalDismiss } from '@/navigation/useModalDismiss';

export function useLobbyModalRoute() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { data: room } = useRoomDetailQuery(roomId ?? '');
  const user = useAuth((state) => state.user);
  const isHostUser = room?.hostId === user?.id;
  const onClose = useModalDismiss(roomId ? appRoutes.lobby({ roomId }) : appRoutes.home);

  return { roomId: roomId ?? '', room, user, isHostUser, onClose };
}
