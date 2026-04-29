import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { Box } from '@/components/ui/box';
import type { Player } from '@/types/rooms';

import { EmptySlot } from './EmptySlot';
import { PlayerCard } from './PlayerCard';

type PlayersSlotsProps = {
  players: Player[];
  hostId: string | null;
  isHostUser: boolean;
  canAddBot: boolean;
  isAddingBot: boolean;
  onAddBot: () => Promise<void>;
  onRenameBot: (botId: string) => void;
  onKick: (playerId: string) => Promise<void>;
  onReorder: (players: Player[]) => Promise<void>;
};

export const PlayersSlots = ({
  players,
  hostId,
  isHostUser,
  canAddBot,
  isAddingBot,
  onAddBot,
  onRenameBot,
  onKick,
  onReorder,
}: PlayersSlotsProps) => {
  const TOTAL_SLOTS = 4;
  const emptySlots = TOTAL_SLOTS - players.length;

  const renderItem: SortableGridRenderItem<Player> = ({ item }) => (
    <PlayerCard
      name={item.name}
      isHost={item.id === hostId}
      isBot={item.playerType === 'bot'}
      isOnline={item.isOnline}
      onRenameBot={
        isHostUser && item.playerType === 'bot'
          ? () => {
              onRenameBot(item.id);
            }
          : undefined
      }
      canRemove={isHostUser && item.id !== hostId}
      onRemove={() => {
        void onKick(item.id);
      }}
    />
  );

  const handleDragEnd = ({ data }: { data: Player[] }) => {
    void onReorder(data);
  };

  const keyExtractor = (item: Player) => item.id;

  return (
    <Box className="flex-1 gap-3">
      <Sortable.Grid
        columns={1}
        data={players}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onDragEnd={handleDragEnd}
        sortEnabled={isHostUser}
        rowGap={12}
      />
      {Array.from({ length: emptySlots }).map((_, i) => (
        <EmptySlot
          key={`empty-${i}`}
          showAddBotAction={isHostUser}
          addBotDisabled={!canAddBot || isAddingBot}
          onAddBot={() => {
            void onAddBot();
          }}
        />
      ))}
    </Box>
  );
};
