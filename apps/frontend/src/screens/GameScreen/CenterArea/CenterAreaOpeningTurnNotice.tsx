import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { badgeToneClassNames } from '@/theme';

const OPENING_NOTICE_SLOT_CLASS_NAME = 'shrink-0 self-stretch justify-center';
const OPENING_NOTICE_RESERVED_SPACE_CLASS_NAME = 'min-h-8';
const OPENING_NOTICE_CARD_CLASS_NAME =
  mergeClassNames('self-stretch rounded-lg px-2.5 py-1', badgeToneClassNames.accentSurface) ?? '';
const OPENING_NOTICE_TEXT_CLASS_NAME =
  'text-center text-[12px] leading-[17px] font-semibold text-text-accent';

type CenterAreaOpeningTurnNoticeProps = {
  openingTurnText: string;
  showOpeningTurnNotice: boolean;
  shouldReserveOpeningTurnNoticeSpace: boolean;
};

export const CenterAreaOpeningTurnNotice = function CenterAreaOpeningTurnNotice({
  openingTurnText,
  showOpeningTurnNotice,
  shouldReserveOpeningTurnNoticeSpace,
}: CenterAreaOpeningTurnNoticeProps) {
  return (
    <Box
      className={mergeClassNames(
        OPENING_NOTICE_SLOT_CLASS_NAME,
        shouldReserveOpeningTurnNoticeSpace && OPENING_NOTICE_RESERVED_SPACE_CLASS_NAME
      )}
    >
      {showOpeningTurnNotice ? (
        <Box className={OPENING_NOTICE_CARD_CLASS_NAME}>
          <Text className={OPENING_NOTICE_TEXT_CLASS_NAME}>{openingTurnText}</Text>
        </Box>
      ) : null}
    </Box>
  );
};
