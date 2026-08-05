import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { QueryState } from '../../../../../components/common/QueryState';
import type { RoleOption } from '../../../types/team.types';
import styles from '../TeamPage.module.css';
import { permissionLabel } from '../permissionDisplay';
import { roleLabel } from '../teamPage.utils';

interface RolesTableProps {
  roles: RoleOption[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isDeleting: boolean;
  deletingRoleId?: number;
  onCreate: () => void;
  onView: (role: RoleOption) => void;
  onEdit: (role: RoleOption) => void;
  onDelete: (roleId: number) => void;
  onRetry: () => void;
}

export function RolesTable({
  roles,
  isLoading,
  isError,
  error,
  isDeleting,
  deletingRoleId,
  onCreate,
  onView,
  onEdit,
  onDelete,
  onRetry,
}: RolesTableProps) {
  const { t } = useTranslation();

  return (
    <Card className={`panel-card ${styles.tableCard}`}>
      <div className={styles.cardToolbar}>
        <div>
          <Typography.Text strong>{t('team.roles.title')}</Typography.Text>
          <Typography.Text type="secondary">{t('team.roles.subtitle')}</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          {t('team.roles.new')}
        </Button>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        hasData={roles.length > 0}
        emptyTitle={t('team.roles.emptyTitle')}
        emptyDescription={t('team.roles.emptyDescription')}
        onRetry={onRetry}
      >
        <Table
          rowKey="id"
          dataSource={roles}
          scroll={{ x: 980 }}
          columns={[
            {
              title: t('team.roles.column.role'),
              fixed: 'left',
              width: 260,
              render: (_, record) => (
                <div className={styles.roleCell}>
                  <div>
                    <Typography.Text strong>{roleLabel(record.name)}</Typography.Text>
                    <Typography.Text type="secondary">
                      {record.systemRole ? t('team.roles.systemRole') : t('team.roles.customRole')}
                    </Typography.Text>
                  </div>
                  {record.editable ? <Tag color="purple">{t('common.editable')}</Tag> : <Tag>{t('common.protected')}</Tag>}
                </div>
              ),
            },
            {
              title: t('team.roles.column.coverage'),
              width: 220,
              render: (_, record) => (
                <Typography.Text>{t('common.permissionsCount', { count: record.permissions.length })}</Typography.Text>
              ),
            },
            {
              title: t('team.roles.column.keyPermissions'),
              width: 420,
              render: (_, record) => (
                <Space size={[6, 6]} wrap>
                  {record.permissions.slice(0, 5).map((permission) => (
                    <Tag key={permission}>{permissionLabel(permission, t)}</Tag>
                  ))}
                  {record.permissions.length > 5 ? (
                    <Tooltip
                      title={record.permissions
                        .slice(5)
                        .map((permission) => permissionLabel(permission, t))
                        .join(', ')}
                    >
                      <Tag>+{record.permissions.length - 5}</Tag>
                    </Tooltip>
                  ) : null}
                </Space>
              ),
            },
            {
              title: t('common.actions'),
              fixed: 'right',
              width: 144,
              render: (_, record) => (
                <Space size={4}>
                  <Tooltip title={t('team.roles.view')}>
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      aria-label={`${t('team.roles.view')} ${record.name}`}
                      onClick={() => onView(record)}
                    />
                  </Tooltip>
                  {record.editable ? (
                    <>
                      <Tooltip title={t('team.roles.edit')}>
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          aria-label={`${t('team.roles.edit')} ${record.name}`}
                          onClick={() => onEdit(record)}
                        />
                      </Tooltip>
                      <Popconfirm
                        title={t('team.roles.deleteTitle')}
                        description={t('team.roles.deleteDescription')}
                        okText={t('common.delete')}
                        okButtonProps={{ danger: true }}
                        onConfirm={() => onDelete(record.id)}
                      >
                        <Tooltip title={t('common.delete')}>
                          <Button
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            loading={isDeleting && deletingRoleId === record.id}
                            aria-label={`${t('common.delete')} ${record.name}`}
                          />
                        </Tooltip>
                      </Popconfirm>
                    </>
                  ) : null}
                </Space>
              ),
            },
          ]}
        />
      </QueryState>
    </Card>
  );
}