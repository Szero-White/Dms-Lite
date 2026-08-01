import {
  DEFAULT_LAUNCHER_SIZE,
  LAUNCHER_PANEL_GAP,
  PANEL_HEIGHT,
  PANEL_WIDTH,
  POSITION_STORAGE_KEY,
  VIEWPORT_MARGIN,
} from './assistant.constants';

export interface AssistantPosition {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

export function getLauncherSize(button: HTMLButtonElement | null) {
  return button?.getBoundingClientRect().width || DEFAULT_LAUNCHER_SIZE;
}

function defaultPosition() {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 };
  }

  return {
    x: window.innerWidth - DEFAULT_LAUNCHER_SIZE - 24,
    y: window.innerHeight - DEFAULT_LAUNCHER_SIZE - 24,
  };
}

export function readStoredPosition() {
  if (typeof window === 'undefined') {
    return defaultPosition();
  }

  const savedPosition = window.localStorage.getItem(POSITION_STORAGE_KEY);

  if (!savedPosition) {
    return defaultPosition();
  }

  try {
    const parsedPosition = JSON.parse(savedPosition) as Partial<AssistantPosition>;

    if (typeof parsedPosition.x === 'number' && typeof parsedPosition.y === 'number') {
      return parsedPosition as AssistantPosition;
    }
  } catch {
    window.localStorage.removeItem(POSITION_STORAGE_KEY);
  }

  return defaultPosition();
}

export function clampLauncherPosition(position: AssistantPosition, launcherSize = DEFAULT_LAUNCHER_SIZE) {
  if (typeof window === 'undefined') {
    return position;
  }

  return {
    x: clamp(position.x, VIEWPORT_MARGIN, window.innerWidth - launcherSize - VIEWPORT_MARGIN),
    y: clamp(position.y, VIEWPORT_MARGIN, window.innerHeight - launcherSize - VIEWPORT_MARGIN),
  };
}

function getPanelSize() {
  if (typeof window === 'undefined') {
    return { width: PANEL_WIDTH, height: PANEL_HEIGHT };
  }

  return {
    width: Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2),
    height: Math.min(PANEL_HEIGHT, window.innerHeight - 112),
  };
}

export function getPanelPosition(position: AssistantPosition, launcherSize = DEFAULT_LAUNCHER_SIZE) {
  if (typeof window === 'undefined') {
    return position;
  }

  const panelSize = getPanelSize();
  const preferredLeft = position.x + launcherSize - panelSize.width;
  const preferredTop = position.y - panelSize.height - LAUNCHER_PANEL_GAP;
  const fallbackTop = position.y + launcherSize + LAUNCHER_PANEL_GAP;
  const nextTop = preferredTop >= VIEWPORT_MARGIN ? preferredTop : fallbackTop;

  return {
    x: clamp(preferredLeft, VIEWPORT_MARGIN, window.innerWidth - panelSize.width - VIEWPORT_MARGIN),
    y: clamp(nextTop, VIEWPORT_MARGIN, window.innerHeight - panelSize.height - VIEWPORT_MARGIN),
  };
}
