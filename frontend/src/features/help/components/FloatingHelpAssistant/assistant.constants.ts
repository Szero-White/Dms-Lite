import { PERMISSIONS } from '../../../auth';

export const GENERAL_PROMPTS = [
  'What should I do next in my assigned work?',
  'Why is a screen missing from my sidebar?',
];

export const POSITION_STORAGE_KEY = 'dms-lite-workflow-buddy-position';
export const VIEWPORT_MARGIN = 16;
export const LAUNCHER_PANEL_GAP = 14;
export const PANEL_WIDTH = 420;
export const PANEL_HEIGHT = 680;
export const DEFAULT_LAUNCHER_SIZE = 76;

interface PromptRule {
  permission: string;
  prompt: string;
}

export const ROLE_PROMPTS: PromptRule[] = [
  { permission: PERMISSIONS.TEAM_MANAGE, prompt: 'How should Owner create a new staff account safely?' },
  { permission: PERMISSIONS.SALES_ORDER_VIEW, prompt: 'How do I handle a sales order correctly?' },
  { permission: PERMISSIONS.INVENTORY_VIEW, prompt: 'How should warehouse staff check and correct stock?' },
  { permission: PERMISSIONS.PAYMENT_CREATE, prompt: 'How should accounting record a customer payment?' },
  { permission: PERMISSIONS.PRODUCT_VIEW, prompt: 'What should I check before changing product data?' },
  { permission: PERMISSIONS.CUSTOMER_VIEW, prompt: 'How should customer information be maintained?' },
  { permission: PERMISSIONS.REPORT_VIEW, prompt: 'How should Owner review dashboard and reports?' },
];
