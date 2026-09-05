import { PERMISSIONS } from '../../../auth';

export const POSITION_STORAGE_KEY = 'dms-lite-workflow-buddy-position';
export const VIEWPORT_MARGIN = 16;
export const LAUNCHER_PANEL_GAP = 14;
export const PANEL_WIDTH = 420;
export const PANEL_HEIGHT = 680;
export const DEFAULT_LAUNCHER_SIZE = 76;

interface PromptRule {
  permissions: string[];
  promptKey: string;
}

export const GENERAL_PROMPT_KEYS = [
  'assistant.prompt.nextWork',
  'assistant.prompt.missingScreen',
];

export const ROLE_PROMPTS: PromptRule[] = [
  { permissions: [PERMISSIONS.TEAM_MANAGE], promptKey: 'assistant.prompt.team' },
  {
    permissions: [PERMISSIONS.SALES_ORDER_VIEW, PERMISSIONS.SALES_ORDER_CREATE],
    promptKey: 'assistant.prompt.sales',
  },
  { permissions: [PERMISSIONS.INVENTORY_VIEW], promptKey: 'assistant.prompt.inventory' },
  { permissions: [PERMISSIONS.PAYMENT_CREATE], promptKey: 'assistant.prompt.payment' },
  { permissions: [PERMISSIONS.PRODUCT_VIEW], promptKey: 'assistant.prompt.product' },
  { permissions: [PERMISSIONS.CUSTOMER_VIEW], promptKey: 'assistant.prompt.customer' },
  { permissions: [PERMISSIONS.REPORT_VIEW], promptKey: 'assistant.prompt.report' },
];