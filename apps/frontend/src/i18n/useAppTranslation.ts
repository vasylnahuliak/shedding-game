import { useTranslation } from 'react-i18next';

import type { I18nNamespace } from '@shedding-game/shared';

export const useAppTranslation = (ns?: I18nNamespace | I18nNamespace[]) => {
  return useTranslation(ns);
};
