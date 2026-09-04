export type DemoAccount = {
  username: string;
  password: string;
  role: 'OWNER' | 'SALE_STAFF' | 'WAREHOUSE_STAFF' | 'ACCOUNTANT';
  badge: string;
};

const DEMO_PASSWORD = (import.meta.env.VITE_DEMO_PASSWORD ?? '').trim() || '123456';

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { username: 'owner', password: DEMO_PASSWORD, role: 'OWNER', badge: 'O' },
  { username: 'sale', password: DEMO_PASSWORD, role: 'SALE_STAFF', badge: 'S' },
  { username: 'warehouse', password: DEMO_PASSWORD, role: 'WAREHOUSE_STAFF', badge: 'W' },
  { username: 'accountant', password: DEMO_PASSWORD, role: 'ACCOUNTANT', badge: 'A' },
];

export const DEFAULT_DEMO_ACCOUNT = DEMO_ACCOUNTS[0];
