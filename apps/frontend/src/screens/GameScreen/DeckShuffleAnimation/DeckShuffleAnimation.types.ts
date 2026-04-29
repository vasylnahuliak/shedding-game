export type DeckShuffleAnimationProps = {
  /** Whether the shuffle animation is currently playing */
  isAnimating: boolean;
  /** Callback fired when the shuffle animation completes */
  onAnimationComplete?: () => void;
};
