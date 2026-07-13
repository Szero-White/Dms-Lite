export interface NotificationItem {
  id: number | string;
  type: string;
  title: string;
  message: string;
  readFlag?: boolean;
  createdAt: string;
  source: 'api' | 'derived';
}
