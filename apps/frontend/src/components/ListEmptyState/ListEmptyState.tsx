import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

interface ListEmptyStateProps {
  title: string;
  description: string;
  icon?: string;
}

export const ListEmptyState = ({ title, description, icon }: ListEmptyStateProps) => {
  return (
    <Box className="w-full items-center justify-center px-10 py-[60px]">
      {icon && <Text className="mb-lg text-[64px] opacity-80">{icon}</Text>}
      <Text className="mb-sm text-center text-xl font-semibold text-text-primary">{title}</Text>
      <Text className="text-center text-sm leading-5 text-text-secondary">{description}</Text>
    </Box>
  );
};
