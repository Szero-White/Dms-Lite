import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
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
import type { TeamMember } from '../../../types/team.types';
import styles from '../TeamPage.module.css';
import { isOwner, roleLabel } from '../teamPage.utils';

interface MembersTableProps {
  members: TeamMember[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isDeactivating: boolean;
  deactivatingMemberId?: number;
  onCreate: () => void;
  onEdit: (member: TeamMember) => void;
  onDeactivate: (memberId: number) => void;
  onRetry: () => void;
}

export function MembersTable({
  members,
  isLoading,
  isError,
  error,
  isDeactivating,
  deactivatingMemberId,
  onCreate,
  onEdit,
  onDeactivate,
  onRetry,
}: MembersTableProps) {
  return (
    <Card className={`panel-card ${styles.tableCard}`}>
      <div className={styles.cardToolbar}>
        <div>
          <Typography.Text strong>Team members</Typography.Text>
          <Typography.Text type="secondary">Assign each employee to the right role.</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          New Member
        </Button>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        hasData={members.length > 0}
        emptyTitle="No team members yet"
        emptyDescription="Create staff accounts so each person works with the right access."
        emptyAction={<Button type="primary" onClick={onCreate}>New Member</Button>}
        onRetry={onRetry}
      >
        <Table
          rowKey="id"
          dataSource={members}
          scroll={{ x: 980 }}
          columns={[
            {
              title: 'Member',
              fixed: 'left',
              width: 280,
              render: (_, record) => (
                <div className={styles.memberCell}>
                  <Avatar icon={<UserOutlined />} />
                  <div>
                    <Typography.Text strong>{record.fullName}</Typography.Text>
                    <Typography.Text type="secondary">@{record.username}</Typography.Text>
                  </div>
                </div>
              ),
            },
            {
              title: 'Roles',
              width: 260,
              render: (_, record) => (
                <Space size={[6, 6]} wrap>
                  {record.roles.map((role) => (
                    <Tag key={role} color={role === 'OWNER' ? 'purple' : 'blue'}>
                      {roleLabel(role)}
                    </Tag>
                  ))}
                </Space>
              ),
            },
            {
              title: 'Permissions',
              width: 320,
              render: (_, record) => (
                <Typography.Text type="secondary">
                  {record.permissions.length} permissions
                </Typography.Text>
              ),
            },
            {
              title: 'Status',
              width: 130,
              render: (_, record) => (
                <Tag color={record.active ? 'green' : 'default'}>
                  {record.active ? 'Active' : 'Inactive'}
                </Tag>
              ),
            },
            {
              title: 'Actions',
              fixed: 'right',
              width: 120,
              render: (_, record) => (isOwner(record) ? (
                <Typography.Text type="secondary">Protected</Typography.Text>
              ) : (
                <Space size={4}>
                  <Tooltip title="Edit access">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      aria-label={`Edit ${record.username}`}
                      onClick={() => onEdit(record)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Deactivate member?"
                    description="The account will no longer be able to sign in."
                    okText="Deactivate"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => onDeactivate(record.id)}
                  >
                    <Tooltip title="Deactivate member">
                      <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        loading={isDeactivating && deactivatingMemberId === record.id}
                        aria-label={`Deactivate ${record.username}`}
                      />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              )),
            },
          ]}
        />
      </QueryState>
    </Card>
  );
}
