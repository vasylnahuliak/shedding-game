import { Emoji } from '@/components/Emoji';
import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { surfaceEffectClassNames } from '@/theme';

type ProfileShortcutCardProps = {
  accessibilityLabel: string;
  description: string;
  icon: string;
  onPress: () => void;
  title: string;
};

export const ProfileShortcutCard = ({
  accessibilityLabel,
  description,
  icon,
  onPress,
  title,
}: ProfileShortcutCardProps) => (
  <Pressable
    className={`flex-row items-center justify-between gap-md rounded-[24px] border border-border-default bg-surface-card-strong px-4 py-4 ${surfaceEffectClassNames.raised}`}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
  >
    <Box className="flex-1 flex-row items-center gap-md">
      <Box className="h-[52px] w-[52px] items-center justify-center rounded-[18px] border border-border-accent-subtle bg-overlay-scrim">
        <Emoji emoji={icon} className="text-[22px]" size={22} accessible={false} />
      </Box>
      <Box className="flex-1 gap-1">
        <Text className="text-[18px] font-extrabold text-text-primary">{title}</Text>
        <Text className="text-[13px] leading-[19px] text-text-tertiary">{description}</Text>
      </Box>
    </Box>
    <Box className="h-9 w-9 items-center justify-center rounded-full border border-border-default bg-overlay-scrim">
      <Text className="text-[22px] leading-[22px] text-text-accent" accessible={false}>
        ›
      </Text>
    </Box>
  </Pressable>
);
