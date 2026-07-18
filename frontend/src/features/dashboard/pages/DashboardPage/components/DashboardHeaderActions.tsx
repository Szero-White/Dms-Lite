import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Segmented, Space } from 'antd';
import type { DashboardRange } from '../dashboardPage.types';
import { rangeLabels } from '../dashboardPage.utils';
import styles from '../DashboardPage.module.css';

interface DashboardHeaderActionsProps {
  canExport: boolean;
  onExport: () => void;
  onRefresh: () => void;
  onRangeChange: (value: DashboardRange) => void;
  range: DashboardRange;
  refreshing: boolean;
}

export function DashboardHeaderActions({
  canExport,
  onExport,
  onRefresh,
  onRangeChange,
  range,
  refreshing,
}: DashboardHeaderActionsProps) {
  return (
    <Space wrap className={styles.headerActions}>
      <Segmented<DashboardRange>
        value={range}
        options={Object.entries(rangeLabels).map(([value, label]) => ({
          value: value as DashboardRange,
          label,
        }))}
        onChange={onRangeChange}
      />
      <Button icon={<ReloadOutlined />} loading={refreshing} onClick={onRefresh}>
        Refresh
      </Button>
      <Button icon={<DownloadOutlined />} disabled={!canExport} onClick={onExport}>
        Export
      </Button>
    </Space>
  );
}
