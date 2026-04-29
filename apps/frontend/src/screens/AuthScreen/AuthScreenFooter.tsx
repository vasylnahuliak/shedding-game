import { Pressable } from 'react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { useAppTranslation } from '@/i18n';
import { openPrivacyPolicy, openTermsOfUse } from '@/services/legalDocuments';
import { panelClassNames } from '@/theme';

type Props = {
  showExpandedFooter: boolean;
};

export const AuthScreenFooter = ({ showExpandedFooter }: Props) => {
  const { t } = useAppTranslation(['auth', 'common']);

  return (
    <Box
      className={mergeClassNames(
        panelClassNames.subtle,
        showExpandedFooter ? 'px-5 py-3.5' : 'px-4 py-3'
      )}
    >
      {showExpandedFooter ? (
        <>
          <Text className="text-center text-[16px] font-bold text-text-primary">
            {t('auth:footer.text')}
          </Text>
          <Text className="mt-1.5 text-center text-[12px] leading-5 text-text-muted">
            {t('auth:footer.legalNotice')}
          </Text>
        </>
      ) : (
        <Text className="text-center text-[12px] leading-5 text-text-muted">
          {t('auth:footer.legalNotice')}
        </Text>
      )}

      <Box
        className={mergeClassNames(
          showExpandedFooter ? 'mt-3' : 'mt-2.5',
          'flex-row flex-wrap items-center justify-center gap-2'
        )}
      >
        <Pressable
          className="rounded-full border border-border-default bg-overlay-scrim px-3 py-2 active:opacity-90"
          onPress={() => {
            void openTermsOfUse();
          }}
        >
          <Text className="text-[12px] font-semibold text-text-secondary">
            {t('common:legal.termsTitle')}
          </Text>
        </Pressable>

        <Text className="text-[12px] text-text-muted">{t('auth:footer.legalSeparator')}</Text>

        <Pressable
          className="rounded-full border border-border-default bg-overlay-scrim px-3 py-2 active:opacity-90"
          onPress={() => {
            void openPrivacyPolicy();
          }}
        >
          <Text className="text-[12px] font-semibold text-text-secondary">
            {t('common:legal.privacyTitle')}
          </Text>
        </Pressable>
      </Box>
    </Box>
  );
};
