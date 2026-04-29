import { surfaceEffectClassNames } from './nativeStyles';

export const panelClassNames = {
  card: 'rounded-[24px] border border-border-default bg-surface-card',
  strong: 'rounded-[20px] border border-border-default bg-surface-card-strong',
  muted: 'rounded-[24px] border border-border-default bg-overlay-scrim',
  accent: 'rounded-[24px] border border-border-accent-subtle bg-surface-card',
  accentStrong: 'rounded-[24px] border border-border-accent-subtle bg-surface-card-strong',
  subtle: 'rounded-[20px] border border-border-subtle bg-overlay-scrim',
  subtleCard: 'rounded-[22px] border border-border-subtle bg-surface-card',
  action: 'rounded-[22px] border border-border-action-subtle bg-overlay-action-soft',
  danger: 'rounded-[20px] border border-feedback-danger bg-overlay-danger-soft',
  closed: 'rounded-[22px] border border-feedback-danger bg-surface-card-closed',
} as const;

export const labelClassNames = {
  eyebrow: 'text-[11px] font-bold uppercase tracking-[0.8px] text-text-tertiary',
  field: 'text-[12px] font-bold uppercase tracking-[0.8px] text-text-tertiary',
} as const;

export const badgeBaseClassNames = {
  pill: 'rounded-full border px-3.5 py-2',
  pillCompact: 'rounded-full border px-3 py-2',
  pillLabel: 'rounded-full border px-3 py-1.5',
  chip: 'rounded-full border px-2.5 py-1',
  icon: 'h-11 w-11 items-center justify-center rounded-[16px] border',
} as const;

export const badgeToneClassNames = {
  cardSurface: 'border-border-default bg-surface-card',
  primary: 'border-border-default bg-surface-badge',
  strongDefault: 'border-border-default bg-surface-card-strong',
  strong: 'border-border-subtle bg-surface-card-strong',
  infoSurface: 'border-transparent bg-feedback-info',
  accent: 'border-border-accent-subtle bg-overlay-accent-soft',
  accentEmphasis: 'border-border-accent-subtle bg-overlay-accent',
  accentEmphasisStrong: 'border-border-accent bg-overlay-accent',
  accentSolid: 'border-border-accent bg-text-accent',
  accentSurface: 'border-border-accent-subtle bg-surface-badge-accent',
  accentSurfaceStrong: 'border-border-accent bg-surface-badge-accent',
  action: 'border-border-action-subtle bg-overlay-action-soft',
  actionSurface: 'border-border-action-subtle bg-surface-action',
  neutral: 'border-border-default bg-overlay-scrim',
  mutedDefault: 'border-border-default bg-surface-card-muted',
  mutedSurface: 'border-border-subtle bg-surface-card-muted',
  disabledSurface: 'border-border-subtle bg-surface-button-disabled',
  closedDefault: 'border-border-default bg-surface-card-closed',
  surface: 'border-border-default bg-surface-icon-button',
  success: 'border-feedback-success bg-overlay-success-soft',
  danger: 'border-feedback-danger bg-overlay-danger-soft',
  dangerSurface: 'border-border-danger bg-surface-icon-button-danger',
  face: 'border-border-card-face bg-surface-card-face',
} as const;

export const badgeTextToneClassNames = {
  accent: 'text-text-accent',
  action: 'text-text-action',
  onAction: 'text-text-on-action',
  neutral: 'text-text-secondary',
  tertiary: 'text-text-tertiary',
  success: 'text-feedback-success',
  danger: 'text-feedback-danger',
  face: 'text-text-on-card-face',
  onAccent: 'text-text-on-accent',
  primary: 'text-text-primary',
  muted: 'text-text-muted',
} as const;

export const modalHeaderClassNames = {
  root: 'relative mb-5 flex-row items-start',
  body: 'flex-1 items-center',
  bodyWithClose: 'px-10',
  titleRow: 'w-full max-w-full flex-row flex-wrap items-center justify-center gap-2',
  title: 'text-center text-[22px] font-extrabold leading-7 text-text-primary',
  subtitle: 'mt-2 max-w-[360px] text-center text-[14px] leading-5 text-text-secondary',
  closeButton: `absolute right-0 top-0 h-10 w-10 items-center justify-center rounded-full border border-border-default bg-surface-icon-button ${surfaceEffectClassNames.card}`,
  closeIcon: 'text-[16px] font-bold text-text-primary',
} as const;

export const messageBannerClassNames = {
  root: 'mb-lg flex-row items-start gap-2.5 rounded-[18px] border px-3.5 py-3',
  icon: 'mt-0.5 text-[16px]',
  text: 'flex-1 text-sm leading-5',
} as const;

export const messageToneClassNames = {
  success: 'border-feedback-success bg-overlay-success-soft',
  danger: 'border-feedback-danger bg-overlay-danger-soft',
  notice: 'border-feedback-success bg-overlay-success-soft',
  error: 'border-feedback-danger bg-overlay-danger-soft',
} as const;

export const messageTextToneClassNames = {
  success: 'text-feedback-success',
  danger: 'text-feedback-danger',
  notice: 'text-feedback-success',
  error: 'text-feedback-danger',
} as const;
