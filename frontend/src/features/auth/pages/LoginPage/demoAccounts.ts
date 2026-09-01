export type DemoAccount = {
  username: string;
  password: string;
  role: string;
  badge: string;
};

const DEMO_PASSWORD = '123456';

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { username: 'owner', password: DEMO_PASSWORD, role: 'Owner', badge: 'O' },
  { username: 'sale', password: DEMO_PASSWORD, role: 'Sales', badge: 'S' },
  { username: 'warehouse', password: DEMO_PASSWORD, role: 'Warehouse', badge: 'W' },
  { username: 'accountant', password: DEMO_PASSWORD, role: 'Accountant', badge: 'A' },
];

export const DEFAULT_DEMO_ACCOUNT = DEMO_ACCOUNTS[0];
