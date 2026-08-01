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
import { QueryState } from '../../../../../components/common/QueryState';
import type { RoleOption } from '../../../types/team.types';
import styles from '../TeamPage.module.css';
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
  return (
    <Card className={`panel-card ${styles.tableCard}`}>
      <div className={styles.cardToolbar}>
        <div>
          <Typography.Text strong>Roles & Permissions</Typography.Text>
          <Typography.Text type="secondary">Create custom roles without changing protected system roles.</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          New Role
        </Button>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        hasData={roles.length > 0}
        emptyTitle="No roles available"
        emptyDescription="Seeded roles should appear here after the backend starts."
        onRetry={onRetry}
      >
        <Table
          rowKey="id"
          dataSource={roles}
          scroll={{ x: 980 }}
          columns={[
            {
              title: 'Role',
              fixed: 'left',
              width: 260,
              render: (_, record) => (
                <div className={styles.roleCell}>
                  <div>
                    <Typography.Text strong>{roleLabel(record.name)}</Typography.Text>
                    <Typography.Text type="secondary">
                      {record.systemRole ? 'System role' : 'Custom role'}
                    </Typography.Text>
                  </div>
                  {record.editable ? <Tag color="purple">Editable</Tag> : <Tag>Protected</Tag>}
                </div>
              ),
            },
            {
              title: 'Permission coverage',
              width: 220,
              render: (_, record) => (
                <Typography.Text>{record.permissions.length} permissions</Typography.Text>
              ),
            },
            {
              title: 'Key permissions',
              width: 420,
              render: (_, record) => (
                <Space size={[6, 6]} wrap>
                  {record.permissions.slice(0, 5).map((permission) => (
                    <Tag key={permission}>{permission}</Tag>
                  ))}
                  {record.permissions.length > 5 ? <Tag>+{record.permissions.length - 5}</Tag> : null}
                </Space>
              ),
            },
            {
              title: 'Actions',
              fixed: 'right',
              width: 144,
              render: (_, record) => (
                <Space size={4}>
                  <Tooltip title="View role">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      aria-label={`View ${record.name}`}
                      onClick={() => onView(record)}
                    />
                  </Tooltip>
                  {record.editable ? (
                    <>
                      <Tooltip title="Edit role">
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          aria-label={`Edit ${record.name}`}
                          onClick={() => onEdit(record)}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="Delete custom role?"
                        description="Only roles not assigned to members can be deleted."
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => onDelete(record.id)}
                      >
                        <Tooltip title="Delete role">
                          <Button
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            loading={isDeleting && deletingRoleId === record.id}
                            aria-label={`Delete ${record.name}`}
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
