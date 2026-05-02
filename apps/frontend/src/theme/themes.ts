const palette = {
  white: '#FFF9F0',
  paper: '#FFF4DF',
  gold: '#F2C14E',
  teal: '#2F9E5C',
  blue: '#77A8FF',
  green: '#6ED7A3',
  orange: '#F0B763',
  red: '#F37B6B',
  slate950: '#0C2F21',
  slate900: '#123B2A',
  slate800: '#1B523B',
  slate700: '#5E8A72',
  ink: '#122018',
} as const;

const overlay = {
  scrim: 'rgba(2, 13, 8, 0.3)',
  scrimStrong: 'rgba(2, 13, 8, 0.44)',
  scrimHero: 'rgba(3, 11, 8, 0.7)',
  lineSoft: 'rgba(255, 249, 240, 0.08)',
  line: 'rgba(255, 244, 223, 0.16)',
  lineStrong: 'rgba(255, 244, 223, 0.28)',
  textMuted: 'rgba(255, 244, 223, 0.54)',
  textSoft: 'rgba(255, 244, 223, 0.74)',
  textStrong: 'rgba(255, 249, 240, 0.92)',
  accentSoft: 'rgba(242, 193, 78, 0.16)',
  accent: 'rgba(242, 193, 78, 0.24)',
  accentStrong: 'rgba(242, 193, 78, 0.4)',
  actionSoft: 'rgba(47, 158, 92, 0.16)',
  action: 'rgba(47, 158, 92, 0.26)',
  infoSoft: 'rgba(119, 168, 255, 0.18)',
  successSoft: 'rgba(110, 215, 163, 0.16)',
  dangerSoft: 'rgba(243, 123, 107, 0.18)',
  danger: 'rgba(243, 123, 107, 0.34)',
} as const;

const shadow = {
  hero: 'rgba(0, 0, 0, 0.44)',
  strong: 'rgba(0, 0, 0, 0.34)',
  medium: 'rgba(0, 0, 0, 0.28)',
  soft: 'rgba(0, 0, 0, 0.22)',
  accent: 'rgba(242, 193, 78, 0.26)',
  action: 'rgba(47, 158, 92, 0.28)',
} as const;

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  round: 999,
  circleSm: 88,
  circleLg: 132,
} as const;

const createAppTheme = <
  const TName extends string,
  TTheme extends {
    statusBarStyle: 'light' | 'dark';
    surface: Record<string, string>;
    text: Record<string, string>;
    border: Record<string, string>;
    feedback: Record<string, string>;
  },
>(
  name: TName,
  config: TTheme
) =>
  ({
    name,
    overlay,
    shadow,
    spacing,
    radius,
    ...config,
  }) as const;

const darkTheme = createAppTheme('dark', {
  statusBarStyle: 'light',
  surface: {
    screen: palette.slate950,
    screenRaised: palette.slate900,
    card: 'rgba(18, 59, 42, 0.9)',
    cardStrong: palette.slate800,
    cardMuted: 'rgba(5, 20, 12, 0.42)',
    modal: 'rgba(14, 49, 35, 0.98)',
    input: '#174432',
    inputFocused: '#1F513B',
    badge: 'rgba(255, 249, 240, 0.08)',
    badgeAccent: overlay.accentSoft,
    iconButton: 'rgba(255, 249, 240, 0.07)',
    iconButtonDanger: overlay.dangerSoft,
    buttonDisabled: '#496756',
    cardClosed: '#314636',
    cardFace: '#FFFFFF',
    action: palette.teal,
  },
  text: {
    primary: palette.white,
    secondary: overlay.textStrong,
    tertiary: overlay.textSoft,
    muted: overlay.textMuted,
    accent: palette.gold,
    action: palette.teal,
    onAccent: palette.ink,
    onAction: palette.white,
    onCardFace: palette.ink,
    success: palette.green,
    danger: palette.red,
    info: palette.blue,
    placeholder: palette.slate700,
  },
  border: {
    default: overlay.line,
    subtle: overlay.lineSoft,
    strong: overlay.lineStrong,
    accent: palette.gold,
    accentSubtle: overlay.accent,
    action: palette.teal,
    actionSubtle: overlay.action,
    focus: palette.gold,
    danger: palette.red,
    input: overlay.lineStrong,
    cardFace: 'rgba(23, 27, 32, 0.12)',
  },
  feedback: {
    success: palette.green,
    danger: palette.red,
    warning: palette.orange,
    info: palette.blue,
  },
});

/** Direct reference to the active dark theme for components and shared style helpers */
export const theme = darkTheme;
