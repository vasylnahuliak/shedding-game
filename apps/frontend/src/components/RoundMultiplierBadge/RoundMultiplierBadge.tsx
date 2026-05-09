import { Emoji } from '@/components/Emoji';
import { Pressable } from '@/components/ui/pressable';
import { useAppTranslation } from '@/i18n';
import type { Player, RoundScore } from '@/types/rooms';
import { showAlert } from '@/utils/alert';

interface RoundMultiplierBadgeProps {
  players: Player[];
  scoreHistory?: RoundScore[][];
  reshuffleCount: number;
}

export const RoundMultiplierBadge = ({
  players,
  scoreHistory,
  reshuffleCount,
}: RoundMultiplierBadgeProps) => {
  const { t } = useAppTranslation(['alerts', 'common', 'game']);
  const lastRound = scoreHistory?.length ? scoreHistory[scoreHistory.length - 1] : [];
  const bridgeEntry = lastRound.find((s) => s.event?.type === 'bridge');
  const hasBridge = !!bridgeEntry;
  const totalMultiplier = 1 + reshuffleCount + (hasBridge ? 1 : 0);

  const bridgePlayer = hasBridge ? players.find((p) => p.id === bridgeEntry?.playerId) : null;

  const handlePress = () => {
    const explanationParts: string[] = [];

    explanationParts.push(t('game:roundMultiplier.base'));

    if (reshuffleCount > 0) {
      explanationParts.push(t('game:roundMultiplier.reshuffle', { count: reshuffleCount }));
    }

    if (hasBridge) {
      explanationParts.push(
        t('game:roundMultiplier.bridge', {
          name: bridgePlayer?.name ?? t('common:defaults.unknownWinner'),
        })
      );
    }

    explanationParts.push(`\n${t('game:roundMultiplier.final', { count: totalMultiplier })}`);

    showAlert(t('alerts:titles.roundMultiplier'), explanationParts.join('\n'), [
      { text: t('common:buttons.ok') },
    ]);
  };

  return (
    <Pressable className="flex-row items-center" onPress={handlePress}>
      {Array.from({ length: totalMultiplier }).map((_, index) => (
        <Emoji key={index} emoji="🔥" className="text-[13px]" size={13} />
      ))}
    </Pressable>
  );
};
