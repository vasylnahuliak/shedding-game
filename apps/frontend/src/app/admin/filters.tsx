import { modalContentNarrowClassName } from '@/components/Modal';
import { ModalRouteFrame } from '@/components/ModalRouteFrame';
import { appRoutes } from '@/navigation/appRoutes';
import { useModalDismiss } from '@/navigation/useModalDismiss';
import { FilterModal } from '@/screens/AdminScreen/components/FilterModal/FilterModal';

export default function AdminFiltersRoute() {
  const onClose = useModalDismiss(appRoutes.adminGames);

  return (
    <ModalRouteFrame onRequestClose={onClose} contentClassName={modalContentNarrowClassName}>
      <FilterModal onClose={onClose} />
    </ModalRouteFrame>
  );
}
