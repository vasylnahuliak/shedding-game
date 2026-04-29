export type CardMetrics = {
  width: number;
  height: number;
  borderRadius: number;
  padding: number;
  cornerFontSize: number;
  cornerLineHeight: number;
  selectedBorderWidth: number;
};

type CardMetricPreset = 'default' | 'small' | 'game';

type CardMetricPresetClassNames = {
  frame: string;
  padding: string;
  selectedBorder: string;
  cornerText: string;
  overlayRadius: string;
};

function createCardMetrics({
  width,
  height,
  borderRadius = 10,
  padding = 8,
  cornerFontSize = 20,
  cornerLineHeight = 22,
  selectedBorderWidth = 3,
}: Partial<CardMetrics> & Pick<CardMetrics, 'width' | 'height'>): CardMetrics {
  return {
    width,
    height,
    borderRadius,
    padding,
    cornerFontSize,
    cornerLineHeight,
    selectedBorderWidth,
  };
}

export const DEFAULT_CARD_METRICS = createCardMetrics({
  width: 60,
  height: 90,
});

export const SMALL_CARD_METRICS = createCardMetrics({
  width: 36,
  height: 50,
  borderRadius: 6,
  padding: 3,
  cornerFontSize: 11,
  cornerLineHeight: 13,
  selectedBorderWidth: 2,
});

export const GAME_CARD_METRICS = createCardMetrics({
  width: 64,
  height: 96,
  borderRadius: 11,
  padding: 8,
  cornerFontSize: 21,
  cornerLineHeight: 24,
  selectedBorderWidth: 2,
});

const DEFAULT_CARD_FRAME_CLASS_NAME = 'h-[90px] w-[60px] rounded-[10px]';
const SMALL_CARD_FRAME_CLASS_NAME = 'h-[50px] w-9 rounded-[6px]';
const GAME_CARD_SIZE_CLASS_NAME = 'h-[96px] w-[64px]';
export const GAME_CARD_FRAME_CLASS_NAME = `${GAME_CARD_SIZE_CLASS_NAME} rounded-[11px]`;
export const GAME_CARD_DECK_SLOT_CLASS_NAME = `relative ${GAME_CARD_SIZE_CLASS_NAME}`;
export const GAME_CARD_ABSOLUTE_FRAME_CLASS_NAME = `absolute ${GAME_CARD_SIZE_CLASS_NAME}`;
export const GAME_CARD_BACK_CLASS_NAME = `${GAME_CARD_FRAME_CLASS_NAME} border-2 border-border-danger bg-feedback-danger`;
export const GAME_PLAYER_HAND_CONTAINER_CLASS_NAME = 'relative h-[108px] overflow-visible px-2';

export const CARD_METRIC_PRESET_CLASS_NAMES: Record<CardMetricPreset, CardMetricPresetClassNames> =
  {
    default: {
      frame: DEFAULT_CARD_FRAME_CLASS_NAME,
      padding: 'p-2',
      selectedBorder: 'border-[3px]',
      cornerText: 'text-[20px] leading-[22px]',
      overlayRadius: 'rounded-[10px]',
    },
    small: {
      frame: SMALL_CARD_FRAME_CLASS_NAME,
      padding: 'p-[3px]',
      selectedBorder: 'border-2',
      cornerText: 'text-[11px] leading-[13px]',
      overlayRadius: 'rounded-[6px]',
    },
    game: {
      frame: GAME_CARD_FRAME_CLASS_NAME,
      padding: 'p-2',
      selectedBorder: 'border-2',
      cornerText: 'text-[21px] leading-[24px]',
      overlayRadius: 'rounded-[11px]',
    },
  };

function isSameMetrics(left: CardMetrics, right: CardMetrics) {
  return (
    left.width === right.width &&
    left.height === right.height &&
    left.borderRadius === right.borderRadius &&
    left.padding === right.padding &&
    left.cornerFontSize === right.cornerFontSize &&
    left.cornerLineHeight === right.cornerLineHeight &&
    left.selectedBorderWidth === right.selectedBorderWidth
  );
}

export function getCardMetricPreset(metrics: CardMetrics): CardMetricPreset | null {
  if (isSameMetrics(metrics, DEFAULT_CARD_METRICS)) {
    return 'default';
  }

  if (isSameMetrics(metrics, SMALL_CARD_METRICS)) {
    return 'small';
  }

  if (isSameMetrics(metrics, GAME_CARD_METRICS)) {
    return 'game';
  }

  return null;
}
