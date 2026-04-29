import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { badgeToneClassNames, surfaceEffectClassNames } from '@/theme';

const CONTROLS_SLOT_CLASS_NAME = 'shrink-0 self-stretch min-h-11 justify-center';
const CONTROLS_ROW_CLASS_NAME = 'shrink-0 self-stretch flex-row gap-2';
const ACTION_BUTTON_BASE_CLASS_NAME =
  'flex-1 min-h-11 items-center justify-center rounded-[11px] border px-3.5 py-[11px]';

type CenterAreaFooterProps = {
  drawButtonText: string;
  handleDraw: () => void;
  handlePlay: () => void;
  isDrawDisabled: boolean;
  isPlayDisabled: boolean;
  isTopSix: boolean;
  playButtonText: string;
  showActionButtons: boolean;
};

export const CenterAreaFooter = function CenterAreaFooter({
  drawButtonText,
  handleDraw,
  handlePlay,
  isDrawDisabled,
  isPlayDisabled,
  isTopSix,
  playButtonText,
  showActionButtons,
}: CenterAreaFooterProps) {
  const drawButtonShadowClassName = isDrawDisabled
    ? undefined
    : isTopSix
      ? surfaceEffectClassNames.accent
      : surfaceEffectClassNames.action;
  const playButtonShadowClassName = isPlayDisabled ? undefined : surfaceEffectClassNames.action;
  const drawButtonClassName = mergeClassNames(
    ACTION_BUTTON_BASE_CLASS_NAME,
    'disabled:opacity-100',
    isDrawDisabled
      ? badgeToneClassNames.disabledSurface
      : isTopSix
        ? 'border-border-accent-subtle bg-feedback-warning'
        : 'border-feedback-success bg-feedback-success',
    drawButtonShadowClassName
  );
  const playButtonClassName = mergeClassNames(
    ACTION_BUTTON_BASE_CLASS_NAME,
    'disabled:opacity-100',
    isPlayDisabled ? badgeToneClassNames.disabledSurface : badgeToneClassNames.actionSurface,
    playButtonShadowClassName
  );

  return (
    <Box className={CONTROLS_SLOT_CLASS_NAME}>
      {showActionButtons ? (
        <Box className={CONTROLS_ROW_CLASS_NAME}>
          <Pressable className={drawButtonClassName} onPress={handleDraw} disabled={isDrawDisabled}>
            <Text
              className={mergeClassNames(
                'text-center text-[13px] font-bold',
                isDrawDisabled ? 'text-text-muted' : 'text-text-on-action'
              )}
            >
              {drawButtonText}
            </Text>
          </Pressable>

          <Pressable className={playButtonClassName} onPress={handlePlay} disabled={isPlayDisabled}>
            <Text
              className={mergeClassNames(
                'text-center text-[13px] font-bold',
                isPlayDisabled ? 'text-text-muted' : 'text-text-on-action'
              )}
            >
              {playButtonText}
            </Text>
          </Pressable>
        </Box>
      ) : null}
    </Box>
  );
};
