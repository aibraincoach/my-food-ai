/** The authored design values. Run scripts/build-tokens.mjs after changing these. */
export const tokens = {
  colors: {
    surface: '#FAFAF9', text: '#1A1917', muted: '#7A766F', faint: '#B4AFA7',
    hairline: '#EDEAE4', line: '#E3E0DA', ring: '#D6D2CB', field: '#F1EEE8', card: '#F3F1EC',
    'shimmer-a': '#EFECE6', 'shimmer-b': '#F7F5F1', white: '#FFFFFF',
    accent: 'oklch(0.62 0.15 25)', 'accent-halo': 'oklch(0.62 0.15 25 / 0.18)',
    camera: '#111111', 'camera-muted': '#9A958D', 'camera-field': 'rgba(255,255,255,0.10)',
    'camera-button': 'rgba(255,255,255,0.12)', scrim: 'rgba(26,25,23,0.40)',
    overlay: 'rgba(26,25,23,0.70)', facebook: '#1877F2',
    'outline-1': 'oklch(0.72 0.14 25)', 'outline-2': 'oklch(0.72 0.14 150)',
    'outline-3': 'oklch(0.72 0.14 230)', 'outline-4': 'oklch(0.72 0.14 300)',
  },
  typography: {
    'display-day': { size: 96, weight: 300, tracking: -5, leading: 0.9 },
    'display-card': { size: 72, weight: 300, tracking: -3, leading: 1 },
    title: { size: 22, weight: 600, tracking: -0.3, leading: 1.3 },
    'sheet-title': { size: 17, weight: 600, tracking: 0, leading: 1.3 },
    body: { size: 15, weight: 500, tracking: 0, leading: 1.4 },
    comment: { size: 14, weight: 400, tracking: 0, leading: 1.45 },
    detail: { size: 13, weight: 400, tracking: 0, leading: 1.3 },
    meta: { size: 12, weight: 400, tracking: 0, leading: 1.4 },
    label: { size: 11, weight: 400, tracking: 0, leading: 1.4 },
    bubble: { size: 10, weight: 400, tracking: 0, leading: 1.4 },
    'day-macro': { size: 22, weight: 400, tracking: -0.5, leading: 1.3 },
    'tile-kcal': { size: 22, weight: 300, tracking: 0, leading: 1.3 },
  },
  spacing: {
    grid: 4, 'screen-x': 20, 'card-gap': 24, 'table-row': 30, 'item-row': 22,
    'field-h': 48, 'bar-h': 83, 'top-h': 48, tap: 44, phone: 390,
    'field-x': 16, 'sheet-top': 12, 'sheet-bottom': 40, 'sheet-gap': 20,
    'handle-w': 36, 'handle-h': 4, icon: 24, 'icon-small': 14, 'icon-thumb': 20,
    'tooltip-y': 10, 'tooltip-x': 14, 'tooltip-caret': 12, 'tooltip-offset': 6,
    'shimmer-h': 12, brand: 64, 'card-padding': 32, 'macro-gap': 28,
  },
  calendar: { cell: 46, border: 1.5, padding: 5, rowGap: 6, outerX: 12, columnGap: 4, weekdayY: 8, labelHeight: 12, labelGap: 4 },
  radii: { chip: 6, thumb: 8, tile: 10, field: 12, pill: 22, sheet: 28, circle: 9999 },
  border: { hairline: 1 },
  icon: { stroke: 1.7, navigationStroke: 1.8, strongStroke: 2, thumbStroke: 1.6 },
  brand: { barWidth: 6, barHeight: 40, barRadius: 3, angle: 35, dot: 14, dotX: -11, dotY: -9 },
  card: { labelTracking: 0.4, itemLeading: 1.5, emphasisWeight: 600 },
  detail: { outlineWidth: 2, chipX: 7, switchWidth: 22, switchHeight: 13, switchKnob: 9, switchInset: 2 },
  capture: { previewHeight: 330, previewTop: 8, controlsHeight: 104, controlsGap: 40, shutterSize: 72, shutterDisc: 58, shutterBorder: 4, thumbSize: 56, thumbGap: 8, galleryIcon: 22, addIcon: 18, bottomGap: 12 },
  motion: { shimmerSeconds: 1.6 },
  opacity: { lightTooltip: 0.96 },
} as const;

export type TextToken = keyof typeof tokens.typography;
export type ColorToken = keyof typeof tokens.colors;
