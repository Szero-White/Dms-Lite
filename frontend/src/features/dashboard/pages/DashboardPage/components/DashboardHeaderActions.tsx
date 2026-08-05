import { DownOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Dropdown, Segmented, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import type { DashboardRange } from '../dashboardPage.types';
import styles from './DashboardHeaderActions.module.css';

interface DashboardHeaderActionsProps {
  canExport: boolean;
  exporting?: boolean;
  onExport: (format: 'csv' | 'xlsx') => void;
  onRefresh: () => void;
  onRangeChange: (value: DashboardRange) => void;
  range: DashboardRange;
  refreshing: boolean;
}

export function DashboardHeaderActions({
  canExport,
  exporting = false,
  onExport,
  onRefresh,
  onRangeChange,
  range,
  refreshing,
}: DashboardHeaderActionsProps) {
  const { t } = useTranslation();

  return (
    <Space wrap className={styles.headerActions}>
      <Segmented<DashboardRange>
        value={range}
        options={(['TODAY', '7_DAYS', '30_DAYS', 'THIS_MONTH'] as DashboardRange[]).map((value) => ({
          value,
          label: t(`dashboard.range.${value}`),
        }))}
        onChange={onRangeChange}
      />
      <Button icon={<ReloadOutlined />} loading={refreshing} onClick={onRefresh}>
        {t('common.refresh')}
      </Button>
      <Dropdown
        disabled={!canExport}
        menu={{
          items: [
            { key: 'csv', label: t('common.exportCsv') },
            { key: 'xlsx', label: t('common.exportXlsx') },
          ],
          onClick: ({ key }) => onExport(key as 'csv' | 'xlsx'),
        }}
      >
        <Button icon={<DownloadOutlined />} loading={exporting}>
          {t('common.export')} <DownOutlined />
        </Button>
      </Dropdown>
    </Space>
  );
}