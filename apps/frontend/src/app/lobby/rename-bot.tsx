import { useLocalSearchParams } from 'expo-router';

import { modalContentNarrowClassName } from '@/components/Modal';
import { ModalRouteFrame } from '@/components/ModalRouteFrame';
import { RenameBotModalContent } from '@/screens/LobbyScreen/components/RenameBotModal';
import { useLobbyModalRoute } from '@/screens/LobbyScreen/useLobbyModalRoute';

export default function LobbyRenameBotRoute() {
  const { botId } = useLocalSearchParams<{ botId: string }>();
  const { roomId, room, isHostUser, onClose } = useLobbyModalRoute();
  const bot = room?.players.find((player) => player.id === botId && player.playerType === 'bot');

  if (!isHostUser || !room || !bot) {
    onClose();
    return null;
  }

  return (
    <ModalRouteFrame onRequestClose={onClose} contentClassName={modalContentNarrowClassName}>
      <RenameBotModalContent
        roomId={roomId}
        botId={bot.id}
        botName={bot.name}
        players={room.players}
        onClose={onClose}
      />
    </ModalRouteFrame>
  );
}
