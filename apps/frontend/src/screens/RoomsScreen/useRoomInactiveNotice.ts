import { useEffect, useRef } from 'react';

import { useRouter } from 'expo-router';

import { useAppTranslation } from '@/i18n';
import { showAlert } from '@/utils/alert';

const getParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

type UseRoomInactiveNoticeParams = {
  notice?: string | string[];
  noticeDetail?: string | string[];
  noticeAt?: string | string[];
};

export function useRoomInactiveNotice({
  notice,
  noticeDetail,
  noticeAt,
}: UseRoomInactiveNoticeParams) {
  const { t } = useAppTranslation(['rooms', 'alerts']);
  const router = useRouter();
  const shownNoticeKeyRef = useRef<string | null>(null);

  useEffect(
    function showRoomInactiveNotice() {
      const noticeValue = getParamValue(notice);
      if (noticeValue !== 'room_inactive') return;

      const detail = getParamValue(noticeDetail);
      const noticeTimestamp = getParamValue(noticeAt) ?? '';
      const noticeKey = `room_inactive:${noticeTimestamp}:${detail ?? ''}`;
      if (shownNoticeKeyRef.current === noticeKey) return;
      shownNoticeKeyRef.current = noticeKey;

      const baseMessage = t('rooms:notices.roomInactiveBase');
      const detailPrefix = t('rooms:notices.detailPrefix');
      const message = detail ? `${baseMessage}\n\n${detailPrefix}: ${detail}` : baseMessage;
      showAlert(t('alerts:titles.roomUnavailable'), message);
      router.replace('/');
    },
    [notice, noticeAt, noticeDetail, router, t]
  );
}
