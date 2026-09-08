import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Card, Table, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { ReceivableDueTag } from '../../../../../components/common/ReceivableDueTag';
import { formatCurrency, formatDate, formatDateTime, toNumber } from '../../../../../lib/format';
import { compareDate, compareNumber, compareText, TABLE_SORT_DIRECTIONS } from '../../../../../lib/tableSorting';
import type { DebtTransaction } from '../../../types/customer.types';
import styles from '../CustomerDetailPage.module.css';

interface CustomerDebtStatementCardProps {
  transactions: DebtTransaction[];
}

export function CustomerDebtStatementCard({ transactions }: CustomerDebtStatementCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="panel-card" title={t('customers.detail.debtStatement')}>
      <Table
        size="small"
        rowKey="id"
        scroll={{ x: 940 }}
        sortDirections={TABLE_SORT_DIRECTIONS}
        showSorterTooltip={false}
        locale={{ emptyText: t('customers.detail.noDebtTransactions') }}
        dataSource={transactions}
        columns={[
          {
            title: t('customers.detail.date'),
            dataIndex: 'createdAt',
            width: 170,
            defaultSortOrder: 'descend',
            sorter: (first, second) => compareDate(first.createdAt, second.createdAt),
            render: (value) => formatDateTime(value),
          },
          {
            title: t('customers.detail.type'),
            dataIndex: 'sourceType',
            width: 130,
            sorter: (first, second) => compareText(first.sourceType, second.sourceType),
            render: (value: string) => t(`customers.detail.sourceType.${value}`, {
              defaultValue: t('customers.detail.sourceType.UNKNOWN'),
            }),
          },
          {
            title: t('customers.detail.reference'),
            dataIndex: 'sourceCode',
            width: 190,
            sorter: (first, second) => compareText(first.sourceCode, second.sourceCode),
            render: (value: string | null | undefined) => value || '--',
          },
          {
            title: t('customers.detail.direction'),
            dataIndex: 'direction',
            width: 135,
            sorter: (first, second) => compareText(first.direction, second.direction),
            render: (value: string) => {
              const isIncrease = value === 'INCREASE';

              return (
                <Tag className={isIncrease ? styles.increaseTag : styles.decreaseTag}>
                  {isIncrease ? <ArrowUpOutlined /> : <ArrowDownOutlined />}{' '}
                  {t(`customers.detail.directionValue.${value}`, {
                    defaultValue: t('customers.detail.directionValue.UNKNOWN'),
                  })}
                </Tag>
              );
            },
          },
          {
            title: t('customers.detail.amount'),
            dataIndex: 'amount',
            align: 'right',
            sorter: (first, second) => compareNumber(first.amount, second.amount),
            render: (value, record) => (
              <Typography.Text
                className={record.direction === 'INCREASE'
                  ? styles.debtOutstanding
                  : styles.debtClear}
              >
                {formatCurrency(value)}
              </Typography.Text>
            ),
          },
          {
            title: t('customers.detail.remaining'),
            dataIndex: 'remainingAmount',
            align: 'right',
            sorter: (first, second) => compareNumber(first.remainingAmount, second.remainingAmount),
            render: (value, record) => record.direction === 'INCREASE'
              ? formatCurrency(value)
              : '--',
          },
          {
            title: t('customers.detail.dueDate'),
            dataIndex: 'dueDate',
            width: 210,
            sorter: (first, second) => compareDate(first.dueDate, second.dueDate),
            render: (value, record) => value ? (
              <div className={styles.dueDateCell}>
                <span>{formatDate(value)}</span>
                {record.direction === 'INCREASE' && toNumber(record.remainingAmount) > 0 ? (
                  <ReceivableDueTag
                    status={record.dueStatus}
                    daysUntilDue={record.daysUntilDue}
                  />
                ) : null}
              </div>
            ) : '--',
          },
          {
            title: t('inventory.history.note'),
            dataIndex: 'note',
            width: 200,
            ellipsis: true,
            sorter: (first, second) => compareText(first.note, second.note),
          },
        ]}
      />
    </Card>
  );
}
