import { Box } from '@/components/ui/box';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { useAppTranslation } from '@/i18n';

interface ListLoadingStateProps {
  text?: string;
}

export const ListLoadingState = ({ text }: ListLoadingStateProps) => {
  const { t } = useAppTranslation('common');
  const resolvedText = text ?? t('labels.loading');

  return (
    <Box className="flex-1 items-center justify-center pt-[60px]">
      <Spinner size="large" colorClassName="accent-text-accent" />
      <Text className="mt-md text-base text-text-secondary">{resolvedText}</Text>
    </Box>
  );
};
