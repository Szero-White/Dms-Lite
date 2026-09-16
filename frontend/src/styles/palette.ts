/**
 * Runtime palette for charts and Ant Design.
 * Keep this aligned with foundations/tokens.css.
 */
export const uiPalette = {
  brand: {
    primary: '#7069e8',
    hover: '#625cdd',
    active: '#5751d1',
    dark: '#4d48b5',
    soft: '#f3f2fc',
    softHover: '#ebe9fa',
    border: '#dad7f3',
  },
  accent: {
    warm: '#8b84e7',
    soft: '#f7f6fc',
  },
  semantic: {
    success: '#4f8a69',
    successSoft: '#f1f7f3',
    successBorder: '#bdd8c8',
    warning: '#b98538',
    warningSoft: '#fbf6ed',
    warningBorder: '#dfc89f',
    danger: '#c45b5b',
    dangerSoft: '#fbf1f1',
    dangerBorder: '#e3b9b9',
    info: '#65738a',
    infoSoft: '#f3f5f8',
    infoBorder: '#d1d8e2',
  },
  text: {
    primary: '#4b5870',
    heading: '#27344b',
    strong: '#35435e',
    value: '#5751bc',
    secondary: '#627089',
    tertiary: '#7d8a9f',
    muted: '#97a3b5',
  },
  surface: {
    page: '#f7f9fd',
    card: '#ffffff',
    muted: '#f8fafe',
    soft: '#f2f4f9',
    elevated: '#ffffff',
    border: '#e0e5ee',
    borderStrong: '#cbd3df',
    borderSubtle: '#e9edf3',
  },
  chart: {
    primary: '#7069e8',
    secondary: '#65738a',
    warm: '#8b84e7',
    gold: '#c4881c',
    danger: '#c45b5b',
    neutral: '#98a3b3',
    grid: '#e9edf3',
  },
} as const;
