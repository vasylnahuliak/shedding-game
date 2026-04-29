import { useEffect } from 'react';

import { usePathname, useRouter } from 'expo-router';

import {
  appRoutes,
  type ForcedGameModalRouteName,
  getGameModalRouteName,
} from '@/navigation/appRoutes';

import { useGameScreenContext } from '../GameScreenContext';

const getForcedGameModalHref = (roomId: string, routeName: ForcedGameModalRouteName) => {
  switch (routeName) {
    case 'game-over':
      return appRoutes.gameOver({ roomId });
    case 'round-over':
      return appRoutes.gameRoundOver({ roomId });
    case 'bridge':
      return appRoutes.gameBridge({ roomId });
    case 'suit-picker':
      return appRoutes.gameSuitPicker({ roomId });
  }
};

const getDesiredForcedGameModal = ({
  gameStatus,
  isBridgeModalVisible,
  suitPickerMode,
}: {
  gameStatus: string | undefined;
  isBridgeModalVisible: boolean;
  suitPickerMode: 'play' | 'opening_pass' | null;
}): ForcedGameModalRouteName | null => {
  if (gameStatus === 'finished') {
    return 'game-over';
  }

  if (gameStatus === 'round_over') {
    return 'round-over';
  }

  if (isBridgeModalVisible) {
    return 'bridge';
  }

  if (suitPickerMode) {
    return 'suit-picker';
  }

  return null;
};

const isManualGameModalRouteName = (routeName: string | null) =>
  routeName === 'info' || routeName === 'rules' || routeName === 'score';

export const useGameModalSync = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { roomId, room, isBridgeModalVisible, suitPickerMode } = useGameScreenContext();

  const currentGameModalRouteName = getGameModalRouteName(pathname);
  const desiredForcedGameModal = getDesiredForcedGameModal({
    gameStatus: room?.gameStatus,
    isBridgeModalVisible,
    suitPickerMode,
  });

  useEffect(
    function syncForcedGameModalRoute() {
      if (!roomId) {
        return;
      }

      if (desiredForcedGameModal) {
        const targetHref = getForcedGameModalHref(roomId, desiredForcedGameModal);

        if (currentGameModalRouteName === desiredForcedGameModal) {
          return;
        }

        if (isManualGameModalRouteName(currentGameModalRouteName)) {
          router.replace(appRoutes.game({ roomId }));
          return;
        }

        if (currentGameModalRouteName) {
          router.replace(targetHref);
          return;
        }

        router.push(targetHref);
        return;
      }

      if (
        currentGameModalRouteName !== 'game-over' &&
        currentGameModalRouteName !== 'round-over' &&
        currentGameModalRouteName !== 'bridge' &&
        currentGameModalRouteName !== 'suit-picker'
      ) {
        return;
      }

      if (router.canGoBack()) {
        router.back();
        return;
      }

      router.replace(appRoutes.game({ roomId }));
    },
    [currentGameModalRouteName, desiredForcedGameModal, roomId, router]
  );
};
