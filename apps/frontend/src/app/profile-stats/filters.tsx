import { modalContentNarrowClassName } from '@/components/Modal';
import { ModalRouteFrame } from '@/components/ModalRouteFrame';
import { appRoutes } from '@/navigation/appRoutes';
import { useModalDismiss } from '@/navigation/useModalDismiss';
import { FilterModal } from '@/screens/ProfileStatsScreen/components/FilterModal';

export default function ProfileStatsFiltersRoute() {
  const onClose = useModalDismiss(appRoutes.profileStats);

  return (
    <ModalRouteFrame onRequestClose={onClose} contentClassName={modalContentNarrowClassName}>
      <FilterModal onClose={onClose} />
    </ModalRouteFrame>
  );
}
