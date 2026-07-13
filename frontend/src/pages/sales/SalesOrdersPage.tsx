import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Space, Table } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { QueryState } from '../../components/common/QueryState';
import { SalesOrderStatusTag } from '../../components/common/StatusTag';
import { useCustomers } from '../../features/customers';
import { useCancelSalesOrder, useConfirmSalesOrder, useSalesOrders } from '../../hooks/useAppQueries';
import { formatCurrency, formatDateTime } from '../../lib/format';

export function SalesOrdersPage() {
  const navigate = useNavigate();
  const ordersQuery = useSalesOrders();
  const customersQuery = useCustomers();
  const confirmMutation = useConfirmSalesOrder();
  const cancelMutation = useCancelSalesOrder();

  const customersMap = new Map((customersQuery.data ?? []).map((customer) => [customer.id, customer.name]));

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader
        title="Sales Orders"
        subtitle="Review draft orders, confirm shipments, and manage order execution."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/sales-orders/new')}>
            Create Order
          </Button>
        }
      />

      <Card className="panel-card">
        <QueryState isLoading={ordersQuery.isLoading || customersQuery.isLoading} isError={ordersQuery.isError || customersQuery.isError} error={ordersQuery.error || customersQuery.error} hasData={(ordersQuery.data ?? []).length > 0}>
          <Table
            rowKey="id"
            dataSource={ordersQuery.data ?? []}
            columns={[
              { title: 'Order Code', dataIndex: 'code' },
              { title: 'Customer', render: (_, record) => customersMap.get(record.customerId) || `Customer #${record.customerId}` },
              { title: 'Created At', dataIndex: 'createdAt', render: (value) => formatDateTime(value) },
              { title: 'Status', render: (_, record) => <SalesOrderStatusTag status={record.status} /> },
              { title: 'Total', dataIndex: 'totalAmount', render: (value) => formatCurrency(value) },
              { title: 'Paid', dataIndex: 'paidAmount', render: (value) => formatCurrency(value) },
              { title: 'Debt', dataIndex: 'debtAmount', render: (value) => formatCurrency(value) },
              {
                title: 'Action',
                render: (_, record) => (
                  <Space>
                    <Button type="primary" disabled={record.status !== 'DRAFT'} loading={confirmMutation.isPending} onClick={() => confirmMutation.mutate(record.id)}>
                      Confirm
                    </Button>
                    <Button danger disabled={record.status !== 'DRAFT'} loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate(record.id)}>
                      Cancel
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </QueryState>
      </Card>
    </Space>
  );
}
