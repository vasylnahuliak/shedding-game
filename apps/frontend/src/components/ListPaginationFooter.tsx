import { Box } from '@/components/ui/box';
import { Spinner } from '@/components/ui/spinner';

type ListPaginationFooterProps = {
  isLoadingMore: boolean;
};

export const ListPaginationFooter = ({ isLoadingMore }: ListPaginationFooterProps) => {
  return isLoadingMore ? (
    <Box className="items-center pb-lg pt-sm">
      <Spinner size="small" colorClassName="accent-text-accent" />
    </Box>
  ) : (
    <Box className="h-1" />
  );
};
