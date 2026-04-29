/* jscpd:ignore-start */
import type { AppLocale } from '@shedding-game/shared';

import { resolveAppLocale } from '@shedding-game/shared';

import { CardListItem } from '@/components/CardListItem';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { mergeClassNames } from '@/components/ui/utils';
import { formatDateTime, useAppTranslation } from '@/i18n';
import { badgeBaseClassNames, badgeTextToneClassNames, badgeToneClassNames } from '@/theme';

/* jscpd:ignore-end */
import type { AccountDeletionRequestCardProps } from './AccountDeletionRequestCard.types';

const getSourceLabelKey = (source: string) => {
  switch (source) {
    case 'public_web_form':
      return 'requestsCard.sources.publicWebForm' as const;
    default:
      return null;
  }
};

export const AccountDeletionRequestCard = function AccountDeletionRequestCard({
  request,
}: AccountDeletionRequestCardProps) {
  const { t, i18n } = useAppTranslation('admin');
  const locale: AppLocale = resolveAppLocale(i18n.language);
  const sourceLabelKey = getSourceLabelKey(request.source);
  const details = [
    t('requestsCard.submittedAt', { value: formatDateTime(locale, request.createdAt) }),
    t('requestsCard.requestId', { value: request.requestId }),
    t('requestsCard.locale', { value: request.locale.toUpperCase() }),
    request.userId ? t('requestsCard.userId', { value: request.userId }) : null,
  ].filter((detail): detail is string => detail != null);

  return (
    <CardListItem>
      <Box className="gap-3">
        <Box className="flex-row items-start justify-between gap-3">
          <Box className="min-w-0 flex-1 gap-1">
            <Text className="text-[18px] font-extrabold text-text-primary">{request.email}</Text>
            {request.displayName ? (
              <Text className="text-[13px] leading-5 text-text-secondary">
                {t('requestsCard.displayName', { value: request.displayName })}
              </Text>
            ) : null}
          </Box>

          <Box className="flex-row flex-wrap justify-end gap-2">
            {sourceLabelKey ? (
              <Box
                className={mergeClassNames(
                  badgeBaseClassNames.pillLabel,
                  badgeToneClassNames.action
                )}
              >
                <Text
                  className={mergeClassNames(
                    'text-[12px] font-bold',
                    badgeTextToneClassNames.action
                  )}
                >
                  {t(sourceLabelKey)}
                </Text>
              </Box>
            ) : null}
          </Box>
        </Box>

        <Box className="gap-1 rounded-[18px] bg-surface-card-strong px-4 py-3">
          {details.map((detail) => (
            <Text key={`${request.requestId}-${detail}`} className="text-[12px] text-text-tertiary">
              {detail}
            </Text>
          ))}
        </Box>

        {request.notes ? (
          <Box className="rounded-[18px] bg-overlay-scrim px-4 py-3">
            <Text className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-text-accent">
              {t('requestsCard.notesLabel')}
            </Text>
            <Text className="text-[13px] leading-5 text-text-secondary">{request.notes}</Text>
          </Box>
        ) : null}
      </Box>
    </CardListItem>
  );
};
