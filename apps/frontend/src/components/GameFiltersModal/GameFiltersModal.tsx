/* jscpd:ignore-start */
import { Emoji } from '@/components/Emoji';
import { modalScrollAreaClassName, ModalShell } from '@/components/Modal';
import { Box } from '@/components/ui/box';
import { StyledScrollView } from '@/components/ui/interop';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';
import {
  badgeBaseClassNames,
  badgeTextToneClassNames,
  badgeToneClassNames,
  panelClassNames,
  surfaceEffectClassNames,
} from '@/theme';
import type { GameFilters, GameStatusFilter, PlayerTypeFilter } from '@/utils/gameFilters';
/* jscpd:ignore-end */

type FilterOption<TValue extends string> = {
  value: TValue;
  labelKey: GameFilterLabelKey;
  icon: string;
};

type GameFilterLabelKey =
  | 'admin:filters.playerType.all'
  | 'admin:filters.playerType.humansOnly'
  | 'admin:filters.playerType.botsOnly'
  | 'admin:filters.gameStatus.all'
  | 'admin:filters.gameStatus.startedOnly'
  | 'admin:filters.gameStatus.unstartedOnly';

const PLAYER_TYPE_OPTIONS: FilterOption<PlayerTypeFilter>[] = [
  { value: 'all', labelKey: 'admin:filters.playerType.all', icon: '👥' },
  { value: 'humans-only', labelKey: 'admin:filters.playerType.humansOnly', icon: '👤' },
  { value: 'bots-only', labelKey: 'admin:filters.playerType.botsOnly', icon: '🤖' },
];

const GAME_STATUS_OPTIONS: FilterOption<GameStatusFilter>[] = [
  { value: 'all', labelKey: 'admin:filters.gameStatus.all', icon: '🎮' },
  { value: 'started-only', labelKey: 'admin:filters.gameStatus.startedOnly', icon: '▶️' },
  {
    value: 'unstarted-only',
    labelKey: 'admin:filters.gameStatus.unstartedOnly',
    icon: '⏸️',
  },
];

type FilterOptionsListProps<TValue extends string> = {
  onSelect: (value: TValue) => void;
  options: FilterOption<TValue>[];
  selectedValue: TValue;
  translate: (key: GameFilterLabelKey) => string;
};

function FilterOptionsList<TValue extends string>({
  onSelect,
  options,
  selectedValue,
  translate,
}: FilterOptionsListProps<TValue>) {
  return (
    <Box className="gap-3">
      {options.map((option) => {
        const isSelected = selectedValue === option.value;

        return (
          <Pressable
            key={option.value}
            className={mergeClassNames(
              panelClassNames.strong,
              'flex-row items-center gap-3 rounded-[22px] px-4 py-4',
              isSelected ? badgeToneClassNames.accentSurfaceStrong : badgeToneClassNames.strong,
              isSelected ? surfaceEffectClassNames.accent : surfaceEffectClassNames.card
            )}
            onPress={() => {
              onSelect(option.value);
            }}
          >
            <Box
              className={mergeClassNames(
                badgeBaseClassNames.icon,
                isSelected ? badgeToneClassNames.accent : badgeToneClassNames.neutral
              )}
            >
              <Emoji emoji={option.icon} className="text-[20px] leading-6" size={20} />
            </Box>
            <Text
              className={mergeClassNames(
                'flex-1 text-[16px]',
                isSelected
                  ? 'font-extrabold text-text-primary'
                  : 'font-semibold text-text-secondary'
              )}
            >
              {translate(option.labelKey)}
            </Text>
            <Box
              className={mergeClassNames(
                'h-9 w-9 items-center justify-center rounded-full border',
                isSelected ? badgeToneClassNames.accentSolid : badgeToneClassNames.neutral
              )}
            >
              <Text
                className={mergeClassNames(
                  'text-[16px] font-extrabold',
                  isSelected ? badgeTextToneClassNames.onAccent : badgeTextToneClassNames.tertiary
                )}
              >
                {isSelected ? '✓' : ''}
              </Text>
            </Box>
          </Pressable>
        );
      })}
    </Box>
  );
}

type GameFiltersModalProps = {
  filters: GameFilters;
  onClose: () => void;
  setFilter: <K extends keyof GameFilters>(filterKey: K, value: GameFilters[K]) => void;
};

export const GameFiltersModal = function GameFiltersModal({
  filters,
  onClose,
  setFilter,
}: GameFiltersModalProps) {
  const { t } = useAppTranslation('admin');

  return (
    <ModalShell
      title={t('filters.title')}
      onClose={onClose}
      buttons={[{ title: t('common:buttons.done'), onPress: onClose, variant: 'primary' }]}
    >
      <StyledScrollView
        className={modalScrollAreaClassName}
        contentContainerClassName="gap-lg pb-sm"
        showsVerticalScrollIndicator={false}
      >
        <Box className="gap-sm">
          <Text className="px-1 text-[12px] font-bold uppercase tracking-[1px] text-text-tertiary">
            {t('filters.sectionPlayerType')}
          </Text>
          <FilterOptionsList
            options={PLAYER_TYPE_OPTIONS}
            selectedValue={filters.playerTypeFilter}
            onSelect={(value) => {
              setFilter('playerTypeFilter', value);
            }}
            translate={t}
          />
        </Box>

        <Box className="gap-sm">
          <Text className="px-1 text-[12px] font-bold uppercase tracking-[1px] text-text-tertiary">
            {t('filters.sectionGameStatus')}
          </Text>
          <FilterOptionsList
            options={GAME_STATUS_OPTIONS}
            selectedValue={filters.gameStatusFilter}
            onSelect={(value) => {
              setFilter('gameStatusFilter', value);
            }}
            translate={t}
          />
        </Box>
      </StyledScrollView>
    </ModalShell>
  );
};
