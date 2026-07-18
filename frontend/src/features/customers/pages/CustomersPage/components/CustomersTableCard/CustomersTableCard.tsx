import { EyeOutlined, MoreOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Dropdown,
  Input,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { QueryState } from '../../../../../../components/common/QueryState';
import { CustomerDebtTag } from '../../../../../../components/common/StatusTag';
import { formatCurrency, toNumber } from '../../../../../../lib/format';
import type { Customer } from '../../../../types/customer.types';
import styles from './CustomersTableCard.module.css';

interface CustomersTableCardProps {
  activeFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
  creditFilter: 'ALL' | 'NEAR_LIMIT' | 'OVER_LIMIT';
  debtFilter: 'ALL' | 'WITH_DEBT' | 'CLEAR';
  filteredCustomers: Customer[];
  hasFilters: boolean;
  isError: boolean;
  isLoading: boolean;
  keyword: string;
  onActiveFilterChange: (value: 'ALL' | 'ACTIVE' | 'INACTIVE') => void;
  onClearFilters: () => void;
  onCreditFilterChange: (value: 'ALL' | 'NEAR_LIMIT' | 'OVER_LIMIT') => void;
  onDebtFilterChange: (value: 'ALL' | 'WITH_DEBT' | 'CLEAR') => void;
  onKeywordChange: (value: string) => void;
  onRetry: () => void;
  queryError: unknown;
}

export function CustomersTableCard({
  activeFilter,
  creditFilter,
  debtFilter,
  filteredCustomers,
  hasFilters,
  isError,
  isLoading,
  keyword,
  onActiveFilterChange,
  onClearFilters,
  onCreditFilterChange,
  onDebtFilterChange,
  onKeywordChange,
  onRetry,
  queryError,
}: CustomersTableCardProps) {
  const navigate = useNavigate();

  return (
    <Card className={`panel-card ${styles.tableCard}`}>
      <div className={styles.toolbar}>
        <div className={styles.filterControls}>
          <Input
            allowClear
            className={styles.search}
            prefix={<SearchOutlined />}
            placeholder="Search customer, phone, address"
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
          />
          <Select
            className={styles.filter}
            value={activeFilter}
            onChange={onActiveFilterChange}
            options={[
              { value: 'ALL', label: 'All statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />
          <Select
            className={styles.filter}
            value={debtFilter}
            onChange={onDebtFilterChange}
            options={[
              { value: 'ALL', label: 'All debt states' },
              { value: 'WITH_DEBT', label: 'Outstanding debt' },
              { value: 'CLEAR', label: 'Clear balance' },
            ]}
          />
          <Select
            className={styles.filter}
            value={creditFilter}
            onChange={onCreditFilterChange}
            options={[
              { value: 'ALL', label: 'All credit usage' },
              { value: 'NEAR_LIMIT', label: '80%+ credit used' },
              { value: 'OVER_LIMIT', label: 'Over credit limit' },
            ]}
          />
        </div>
        <Button disabled={!hasFilters} onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={queryError}
        hasData={filteredCustomers.length > 0}
        emptyTitle={hasFilters ? 'No customers match these filters' : 'No customers yet'}
        emptyDescription={
          hasFilters
            ? 'Adjust or clear filters to view additional customer profiles.'
            : 'Create the first customer to begin managing orders and receivables.'
        }
        emptyAction={hasFilters ? <Button onClick={onClearFilters}>Clear filters</Button> : null}
        onRetry={onRetry}
      >
        <Table
          rowKey="id"
          sticky
          scroll={{ x: 1160 }}
          dataSource={filteredCustomers}
          rowClassName={(record) => {
            const limit = toNumber(record.creditLimit);
            const usage = limit > 0 ? toNumber(record.debtBalance) / limit : 0;

            return usage >= 0.8 ? styles.creditWarningRow : '';
          }}
          columns={[
            {
              title: 'Customer',
              fixed: 'left',
              width: 300,
              ellipsis: true,
              render: (_, record) => (
                <div className={styles.customerCell}>
                  <Avatar>{record.name.slice(0, 2).toUpperCase()}</Avatar>
                  <div>
                    <Typography.Text strong>{record.name}</Typography.Text>
                    <Tag
                      className={`${styles.statusTag} ${
                        record.active ? styles.active : styles.inactive
                      }`}
                    >
                      {record.active ? 'ACTIVE' : 'INACTIVE'}
                    </Tag>
                  </div>
                </div>
              ),
            },
            { title: 'Phone', dataIndex: 'phone', width: 170, ellipsis: true },
            { title: 'Address', dataIndex: 'address', width: 260, ellipsis: true },
            {
              title: 'Payment Term',
              dataIndex: 'paymentTermDays',
              width: 150,
              render: (value) => `${value} days`,
            },
            {
              title: 'Credit Usage',
              width: 240,
              render: (_, record) => {
                const debt = toNumber(record.debtBalance);
                const limit = toNumber(record.creditLimit);
                const percent = limit > 0 ? Math.round((debt / limit) * 100) : 0;

                return (
                  <div className={styles.creditUsage}>
                    <div>
                      <span>{formatCurrency(debt)}</span>
                      <span>{limit > 0 ? `of ${formatCurrency(limit)}` : 'No credit limit'}</span>
                    </div>
                    <Progress
                      percent={Math.min(percent, 100)}
                      showInfo={false}
                      size="small"
                      status={
                        percent >= 100 ? 'exception' : percent >= 80 ? 'normal' : 'success'
                      }
                    />
                  </div>
                );
              },
            },
            {
              title: 'Debt Balance',
              dataIndex: 'debtBalance',
              width: 190,
              render: (value) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text
                    className={toNumber(value) > 0 ? styles.debtOutstanding : styles.debtClear}
                  >
                    {formatCurrency(value)}
                  </Typography.Text>
                  <CustomerDebtTag amount={toNumber(value)} />
                </Space>
              ),
            },
            {
              title: '',
              fixed: 'right',
              width: 64,
              render: (_, record) => (
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: [{ key: 'view', icon: <EyeOutlined />, label: 'View detail' }],
                    onClick: () => navigate(`/customers/${record.id}`),
                  }}
                >
                  <Button
                    type="text"
                    icon={<MoreOutlined />}
                    aria-label={`Actions for ${record.name}`}
                  />
                </Dropdown>
              ),
            },
          ]}
        />
      </QueryState>
    </Card>
  );
}
