import { BarChartOutlined, DollarOutlined, TeamOutlined, WarningOutlined } from '@ant-design/icons';
import { Card, Progress, Table, Tag } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { uiPalette } from '../../../../../../styles/palette';
import { formatCurrency, toNumber } from '../../../../../../lib/format';
import {
  compareNumber,
  compareText,
  TABLE_SORT_DIRECTIONS,
  TABLE_SORTER_TOOLTIP,
} from '../../../../../../lib/tableSorting';
import type { Customer } from '../../../../../customers';
import { ReportStatStrip } from '../ReportStatStrip';
import styles from '../../ReportsPage.module.css';

interface ReceivablesReportTabProps {
  creditExposure: number;
  customers: Customer[];
  debtorCount: number;
  highRiskCount: number;
  totalReceivables: number;
}

export function ReceivablesReportTab({
  creditExposure,
  customers,
  debtorCount,
  highRiskCount,
  totalReceivables,
}: ReceivablesReportTabProps) {
  const { t } = useTranslation();
  const debtors = useMemo(
    () => [...customers]
      .filter((customer) => toNumber(customer.debtBalance) > 0)
      .sort((first, second) => toNumber(second.debtBalance) - toNumber(first.debtBalance)),
    [customers],
  );
  const maxDebt = toNumber(debtors[0]?.debtBalance ?? 0);

  return (
    <div className={styles.tabContent}>
      <ReportStatStrip items={[
        { icon: <DollarOutlined />, label: t('reports.metric.receivables'), value: formatCurrency(totalReceivables), color: uiPalette.semantic.danger },
        { icon: <TeamOutlined />, label: t('reports.metric.debtorAccounts'), value: debtorCount, color: uiPalette.semantic.warning },
        { icon: <BarChartOutlined />, label: t('reports.metric.creditExposure'), value: formatCurrency(creditExposure), color: uiPalette.brand.primary },
        { icon: <WarningOutlined />, label: t('reports.metric.highRisk'), value: highRiskCount, color: highRiskCount > 0 ? uiPalette.semantic.danger : uiPalette.semantic.success },
      ]} />

      {debtorCount > 0 ? (
        <Card title={t('reports.title')} className="panel-card">
          <div className={styles.debtBarList}>
            {debtors.slice(0, 8).map((customer, index) => {
              const debtPercent = maxDebt > 0
                ? (toNumber(customer.debtBalance) / maxDebt) * 100
                : 0;
              const creditLimit = toNumber(customer.creditLimit);
              const limitPercent = creditLimit > 0
                ? Math.min(Math.round((toNumber(customer.debtBalance) / creditLimit) * 100), 100)
                : 0;

              return (
                <div key={customer.id} className={styles.debtBarRow}>
                  <div className={styles.debtBarMeta}>
                    <span className={styles.debtBarRank}>{index + 1}</span>
                    <span className={styles.debtBarName}>{customer.name}</span>
                    <span className={styles.debtBarTerm}>
                      {t('reports.table.termShort', { count: customer.paymentTermDays })}
                    </span>
                    {limitPercent >= 80 ? (
                      <Tag color={limitPercent >= 100 ? 'error' : 'warning'} style={{ margin: 0 }}>
                        {t('reports.table.ofLimit', { percent: limitPercent })}
                      </Tag>
                    ) : null}
                    <span className={styles.debtBarAmt}>{formatCurrency(customer.debtBalance)}</span>
                  </div>
                  <div className={styles.debtBarTrack}>
                    <div
                      className={styles.debtBarFill}
                      style={{ width: `${debtPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      <Card title={t('reports.title')} className="panel-card">
        <Table
          rowKey="id"
          size="small"
          scroll={{ x: 900 }}
          sortDirections={TABLE_SORT_DIRECTIONS}
          showSorterTooltip={TABLE_SORTER_TOOLTIP}
          dataSource={debtors}
          locale={{ emptyText: t('reports.empty.noReceivables') }}
          columns={[
            { title: t('reports.table.customer'), dataIndex: 'name', sorter: (first, second) => compareText(first.name, second.name) },
            { title: t('reports.table.term'), dataIndex: 'paymentTermDays', sorter: (first, second) => compareNumber(first.paymentTermDays, second.paymentTermDays), render: (value) => t('reports.table.days', { count: value }) },
            { title: t('reports.table.debt'), dataIndex: 'debtBalance', align: 'right', sorter: (first, second) => compareNumber(first.debtBalance, second.debtBalance), render: (value) => formatCurrency(value) },
            { title: t('reports.table.creditLimit'), dataIndex: 'creditLimit', align: 'right', sorter: (first, second) => compareNumber(first.creditLimit, second.creditLimit), render: (value) => formatCurrency(value) },
            {
              title: t('reports.table.utilization'),
              width: 220,
              sorter: (first, second) => {
                const firstLimit = toNumber(first.creditLimit);
                const secondLimit = toNumber(second.creditLimit);
                const firstUsage = firstLimit > 0 ? toNumber(first.debtBalance) / firstLimit : 0;
                const secondUsage = secondLimit > 0 ? toNumber(second.debtBalance) / secondLimit : 0;
                return firstUsage - secondUsage;
              },
              render: (_, customer) => {
                const limit = toNumber(customer.creditLimit);
                const percent = limit > 0
                  ? Math.round((toNumber(customer.debtBalance) / limit) * 100)
                  : 0;

                return (
                  <div className={styles.creditUsage}>
                    <Progress
                      percent={Math.min(percent, 100)}
                      showInfo={false}
                      size="small"
                      status={percent >= 100 ? 'exception' : percent >= 80 ? 'normal' : 'success'}
                    />
                    <Tag color={percent >= 100 ? 'error' : percent >= 80 ? 'warning' : 'success'}>
                      {limit > 0 ? `${percent}%` : t('reports.table.noLimit')}
                    </Tag>
                  </div>
                );
              },
            },
          ]}
        />
      </Card>
    </div>
  );
}
