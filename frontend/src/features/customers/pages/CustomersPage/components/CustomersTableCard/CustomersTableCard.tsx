import {
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Dropdown,
  Input,
  Popconfirm,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { QueryState } from '../../../../../../components/common/QueryState';
import { CustomerDebtTag } from '../../../../../../components/common/StatusTag';
import { formatCurrency, toNumber } from '../../../../../../lib/format';
import type { Customer } from '../../../../types/customer.types';
import styles from './CustomersTableCard.module.css';

interface CustomersTableCardProps {
  canManageCustomers: boolean;
  canChangeCustomerStatus: boolean;
  activeFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
  creditFilter: 'ALL' | 'NEAR_LIMIT' | 'OVER_LIMIT';
  debtFilter: 'ALL' | 'WITH_DEBT' | 'CLEAR';
  changingStatusCustomerId?: number;
  filteredCustomers: Customer[];
  hasFilters: boolean;
  isError: boolean;
  isLoading: boolean;
  keyword: string;
  onActiveFilterChange: (value: 'ALL' | 'ACTIVE' | 'INACTIVE') => void;
  onClearFilters: () => void;
  onCreditFilterChange: (value: 'ALL' | 'NEAR_LIMIT' | 'OVER_LIMIT') => void;
  onDeactivateCustomer: (customerId: number) => void;
  onReactivateCustomer: (customerId: number) => void;
  onDebtFilterChange: (value: 'ALL' | 'WITH_DEBT' | 'CLEAR') => void;
  onEditCustomer: (customer: Customer) => void;
  onKeywordChange: (value: string) => void;
  onRetry: () => void;
  queryError: unknown;
  showFinancials: boolean;
}

export function CustomersTableCard({
  activeFilter,
  canManageCustomers,
  canChangeCustomerStatus,
  creditFilter,
  debtFilter,
  changingStatusCustomerId,
  filteredCustomers,
  hasFilters,
  isError,
  isLoading,
  keyword,
  onActiveFilterChange,
  onClearFilters,
  onCreditFilterChange,
  onDeactivateCustomer,
  onDebtFilterChange,
  onReactivateCustomer,
  onEditCustomer,
  onKeywordChange,
  onRetry,
  queryError,
  showFinancials,
}: CustomersTableCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Card className={`panel-card ${styles.tableCard}`}>
      <div className={styles.toolbar}>
        <div className={styles.filterControls}>
          <Input
            allowClear
            className={styles.search}
            prefix={<SearchOutlined />}
            placeholder={t('customers.filters.searchPlaceholder')}
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
          />
          <Select
            className={styles.filter}
            value={activeFilter}
            onChange={onActiveFilterChange}
            options={[
              { value: 'ALL', label: t('customers.filters.allStatuses') },
              { value: 'ACTIVE', label: t('common.active') },
              { value: 'INACTIVE', label: t('common.inactive') },
            ]}
          />
          {showFinancials ? (
            <>
              <Select
                className={styles.filter}
                value={debtFilter}
                onChange={onDebtFilterChange}
                options={[
                  { value: 'ALL', label: t('customers.filters.allDebtStates') },
                  { value: 'WITH_DEBT', label: t('customers.filters.withDebt') },
                  { value: 'CLEAR', label: t('customers.filters.clearBalance') },
                ]}
              />
              <Select
                className={styles.filter}
                value={creditFilter}
                onChange={onCreditFilterChange}
                options={[
                  { value: 'ALL', label: t('customers.filters.allCreditUsage') },
                  { value: 'NEAR_LIMIT', label: t('customers.filters.nearLimit') },
                  { value: 'OVER_LIMIT', label: t('customers.filters.overLimit') },
                ]}
              />
            </>
          ) : null}
        </div>
        <Button disabled={!hasFilters} onClick={onClearFilters}>
          {t('common.clearFilters')}
        </Button>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={queryError}
        hasData={filteredCustomers.length > 0}
        emptyTitle={
          hasFilters
            ? t('customers.empty.filteredTitle')
            : t('customers.empty.title')
        }
        emptyDescription={
          hasFilters
            ? t('customers.empty.filteredDescription')
            : t('customers.empty.description')
        }
        emptyAction={
          hasFilters ? (
            <Button onClick={onClearFilters}>{t('common.clearFilters')}</Button>
          ) : null
        }
        onRetry={onRetry}
      >
        <Table
          rowKey="id"
          scroll={{ x: 1240 }}
          dataSource={filteredCustomers}
          rowClassName={(record) => {
            if (!showFinancials) {
              return '';
            }

            const limit = toNumber(record.creditLimit);
            const usage = limit > 0 ? toNumber(record.debtBalance) / limit : 0;

            return usage >= 0.8 ? styles.creditWarningRow : '';
          }}
          columns={[
            {
              title: t('customers.column.customer'),
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
                      {record.active ? t('common.active') : t('common.inactive')}
                    </Tag>
                  </div>
                </div>
              ),
            },
            {
              title: t('customers.column.phone'),
              dataIndex: 'phone',
              width: 170,
              ellipsis: true,
            },
            {
              title: t('customers.column.address'),
              dataIndex: 'address',
              width: 260,
              ellipsis: true,
            },
            {
              title: t('customers.column.paymentTerm'),
              dataIndex: 'paymentTermDays',
              width: 150,
              render: (value) => t('customers.paymentTermDays', { count: value }),
            },
            ...(showFinancials ? [
              {
                title: t('customers.column.creditUsage'),
                width: 240,
                render: (_: unknown, record: Customer) => {
                  const debt = toNumber(record.debtBalance);
                  const limit = toNumber(record.creditLimit);
                  const percent = limit > 0 ? Math.round((debt / limit) * 100) : 0;

                  return (
                    <div className={styles.creditUsage}>
                      <div>
                        <span>{formatCurrency(debt)}</span>
                        <span>
                          {limit > 0
                            ? t('customers.creditUsage.ofLimit', {
                                amount: formatCurrency(limit),
                              })
                            : t('customers.creditUsage.noLimit')}
                        </span>
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
                title: t('customers.column.debtBalance'),
                dataIndex: 'debtBalance',
                width: 190,
                render: (value: string | number | null) => (
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
            ] : []),
            {
              title: t('common.actions'),
              fixed: 'right',
              width: 136,
              render: (_, record) => (
                <Space size={4} className={styles.rowActions}>
                  <Tooltip title={t('customers.action.view')}>
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      aria-label={t('customers.action.viewAria', { name: record.name })}
                      onClick={() => navigate(`/customers/${record.id}`)}
                    />
                  </Tooltip>
                  {canManageCustomers ? (
                    <>
                      <Tooltip title={t('customers.action.edit')}>
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          aria-label={t('customers.action.editAria', { name: record.name })}
                          onClick={() => onEditCustomer(record)}
                        />
                      </Tooltip>
                      {canChangeCustomerStatus ? (
                        record.active ? (
                          <Popconfirm
                            title={t('customers.deactivate.title')}
                            description={t('customers.deactivate.description')}
                            okText={t('customers.action.deactivate')}
                            okButtonProps={{ danger: true }}
                            onConfirm={() => onDeactivateCustomer(record.id)}
                          >
                            <Tooltip title={t('customers.action.deactivate')}>
                              <Button
                                danger
                                type="text"
                                icon={<StopOutlined />}
                                loading={changingStatusCustomerId === record.id}
                                aria-label={t('customers.action.deactivateAria', { name: record.name })}
                              />
                            </Tooltip>
                          </Popconfirm>
                        ) : (
                          <Tooltip title={t('customers.action.reactivate')}>
                            <Button
                              type="text"
                              icon={<PlayCircleOutlined />}
                              loading={changingStatusCustomerId === record.id}
                              aria-label={t('customers.action.reactivateAria', { name: record.name })}
                              onClick={() => onReactivateCustomer(record.id)}
                            />
                          </Tooltip>
                        )
                      ) : null}
                    </>
                  ) : null}
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      items: [
                        {
                          key: 'view',
                          icon: <EyeOutlined />,
                          label: t('customers.action.viewDetail'),
                        },
                        ...(canManageCustomers ? [
                          {
                            key: 'edit',
                            icon: <EditOutlined />,
                            label: t('customers.action.edit'),
                          },
                        ] : []),
                      ],
                      onClick: ({ key }) => {
                        if (key === 'edit' && canManageCustomers) {
                          onEditCustomer(record);
                          return;
                        }

                        navigate(`/customers/${record.id}`);
                      },
                    }}
                  >
                    <Button
                      type="text"
                      icon={<MoreOutlined />}
                      aria-label={t('customers.action.moreAria', { name: record.name })}
                    />
                  </Dropdown>
                </Space>
              ),
            },
          ]}
        />
      </QueryState>
    </Card>
  );
}