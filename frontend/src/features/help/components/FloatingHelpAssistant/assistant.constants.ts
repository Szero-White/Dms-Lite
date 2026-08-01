import { PERMISSIONS } from '../../../auth';

export const POSITION_STORAGE_KEY = 'dms-lite-workflow-buddy-position';
export const VIEWPORT_MARGIN = 16;
export const LAUNCHER_PANEL_GAP = 14;
export const PANEL_WIDTH = 420;
export const PANEL_HEIGHT = 680;
export const DEFAULT_LAUNCHER_SIZE = 76;

interface PromptRule {
  permission: string;
  promptKey: string;
}

export const GENERAL_PROMPT_KEYS = [
  'assistant.prompt.nextWork',
  'assistant.prompt.missingScreen',
];

export const ROLE_PROMPTS: PromptRule[] = [
  { permission: PERMISSIONS.TEAM_MANAGE, promptKey: 'assistant.prompt.team' },
  { permission: PERMISSIONS.SALES_ORDER_VIEW, promptKey: 'assistant.prompt.sales' },
  { permission: PERMISSIONS.INVENTORY_VIEW, promptKey: 'assistant.prompt.inventory' },
  { permission: PERMISSIONS.PAYMENT_CREATE, promptKey: 'assistant.prompt.payment' },
  { permission: PERMISSIONS.PRODUCT_VIEW, promptKey: 'assistant.prompt.product' },
  { permission: PERMISSIONS.CUSTOMER_VIEW, promptKey: 'assistant.prompt.customer' },
  { permission: PERMISSIONS.REPORT_VIEW, promptKey: 'assistant.prompt.report' },
];