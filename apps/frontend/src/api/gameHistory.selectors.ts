import type { GameHistoryPage } from '@shedding-game/shared';

type GameHistoryInfiniteData = {
  pages: GameHistoryPage[];
  pageParams: unknown[];
};

export const selectGameHistoryInfiniteData = (data: GameHistoryInfiniteData) => ({
  pages: data.pages,
  pageParams: data.pageParams,
  items: data.pages.flatMap((page) => page.items),
  totalCount: data.pages[0]?.totalCount ?? 0,
});
