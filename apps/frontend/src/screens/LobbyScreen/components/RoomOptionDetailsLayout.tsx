/* jscpd:ignore-start */
import { ModalShell } from '@/components/Modal';
import { Box } from '@/components/ui/box';
import { StyledScrollView } from '@/components/ui/interop';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';
import { badgeBaseClassNames, badgeTextToneClassNames, badgeToneClassNames } from '@/theme';
/* jscpd:ignore-end */

type RoomOptionDetailsLayoutProps = {
  title: string;
  subtitle: string;
  badgeEmoji: string;
  badgeTitle: string;
  description: string;
  isHostUser: boolean;
  onClose: () => void;
  renderList: () => React.ReactNode;
};

export const RoomOptionDetailsLayout = ({
  title,
  subtitle,
  badgeEmoji,
  badgeTitle,
  description,
  isHostUser,
  onClose,
  renderList,
}: RoomOptionDetailsLayoutProps) => {
  const { t } = useAppTranslation(['common']);
  return (
    <ModalShell
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      buttons={[{ title: t('common:buttons.done'), onPress: onClose }]}
    >
      <StyledScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-3 pt-0.5 pb-1"
      >
        {isHostUser ? (
          renderList()
        ) : (
          <>
            <Box
              className={mergeClassNames(
                'self-start flex-row items-center gap-2.5 px-3.5 py-2.5',
                badgeBaseClassNames.pill,
                badgeToneClassNames.accentSurface
              )}
            >
              <Text className="text-xl leading-6">{badgeEmoji}</Text>
              <Text
                className={mergeClassNames('text-sm font-bold', badgeTextToneClassNames.primary)}
              >
                {badgeTitle}
              </Text>
            </Box>

            <Text className="text-sm leading-[21px] text-text-secondary">{description}</Text>
          </>
        )}
      </StyledScrollView>
    </ModalShell>
  );
};
