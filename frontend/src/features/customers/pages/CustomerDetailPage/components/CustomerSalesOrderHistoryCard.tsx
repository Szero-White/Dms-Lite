import { Card, Table } from 'antd';
import { useTranslation } from 'react-i18next';
import { SalesOrderStatusTag } from '../../../../../components/common/StatusTag';
import { formatCurrency, formatDateTime } from '../../../../../lib/format';
import type { SalesOrder } from '../../../../sales';

interface CustomerSalesOrderHistoryCardProps {
  orders: SalesOrder[];
  showFinancials: boolean;
}

export function CustomerSalesOrderHistoryCard({
  orders,
  showFinancials,
}: CustomerSalesOrderHistoryCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="panel-card" title={t('customers.detail.salesOrderHistory')}>
      <Table
        size="small"
        rowKey="id"
        scroll={{ x: 800 }}
        locale={{ emptyText: t('customers.detail.noSalesOrders') }}
        dataSource={orders}
        columns={[
          { title: t('customers.detail.code'), dataIndex: 'code' },
          {
            title: t('customers.detail.createdAt'),
            dataIndex: 'createdAt',
            render: (value) => formatDateTime(value),
          },
          {
            title: t('common.status'),
            dataIndex: 'status',
            render: (value) => <SalesOrderStatusTag status={value} />,
          },
          ...(showFinancials ? [
            {
              title: t('sales.column.total'),
              dataIndex: 'totalAmount',
              render: (value: string | number | null) => formatCurrency(value),
            },
            {
              title: t('sales.column.paid'),
              dataIndex: 'paidAmount',
              render: (_: string | number | null, order: SalesOrder) => order.status === 'COMPLETED'
                ? formatCurrency(order.paidAmount)
                : t('sales.financial.notApplicable'),
            },
            {
              title: t('sales.column.debt'),
              dataIndex: 'debtAmount',
              render: (_: string | number | null, order: SalesOrder) => {
                if (order.status === 'COMPLETED') {
                  return formatCurrency(order.debtAmount);
                }

                return order.status === 'DRAFT'
                  ? t('sales.financial.projectedReceivable', {
                    amount: formatCurrency(order.totalAmount),
                  })
                  : t('sales.financial.notIncurred');
              },
            },
          ] : []),
        ]}
      />
    </Card>
  );
}
