import type { Href } from 'expo-router';

export const getRoomInactiveNoticeHref = (detail?: string): Href => ({
  pathname: '/',
  params: {
    notice: 'room_inactive',
    noticeAt: String(Date.now()),
    ...(detail ? { noticeDetail: detail } : {}),
  },
});
