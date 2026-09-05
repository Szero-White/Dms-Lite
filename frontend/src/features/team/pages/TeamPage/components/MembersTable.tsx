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
import { useTranslation } from 'react-i18next';
import { QueryState } from '../../../../../components/common/QueryState';
import { roleLabel } from '../../../../../lib/roleDisplay';
import type { TeamMember } from '../../../types/team.types';
import styles from '../TeamPage.module.css';
import { isOwner } from '../teamPage.utils';

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
  const { t } = useTranslation();

  return (
    <Card className={`panel-card ${styles.tableCard}`}>
      <div className={styles.cardToolbar}>
        <div>
          <Typography.Text strong>{t('team.members.title')}</Typography.Text>
          <Typography.Text type="secondary">{t('team.members.subtitle')}</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          {t('team.members.new')}
        </Button>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        hasData={members.length > 0}
        emptyTitle={t('team.members.emptyTitle')}
        emptyDescription={t('team.members.emptyDescription')}
        emptyAction={<Button type="primary" onClick={onCreate}>{t('team.members.new')}</Button>}
        onRetry={onRetry}
      >
        <Table
          rowKey="id"
          dataSource={members}
          scroll={{ x: 980 }}
          columns={[
            {
              title: t('team.members.column.member'),
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
              title: t('team.members.column.roles'),
              width: 260,
              render: (_, record) => (
                <Space size={[6, 6]} wrap>
                  {record.roles.map((role) => (
                    <Tag key={role} color={role === 'OWNER' ? 'purple' : 'blue'}>
                      {roleLabel(role, t)}
                    </Tag>
                  ))}
                </Space>
              ),
            },
            {
              title: t('team.members.column.permissions'),
              width: 320,
              render: (_, record) => (
                <Typography.Text type="secondary">
                  {t('common.permissionsCount', { count: record.permissions.length })}
                </Typography.Text>
              ),
            },
            {
              title: t('common.status'),
              width: 130,
              render: (_, record) => (
                <Tag color={record.active ? 'green' : 'default'}>
                  {record.active ? t('common.active') : t('common.inactive')}
                </Tag>
              ),
            },
            {
              title: t('common.actions'),
              fixed: 'right',
              width: 120,
              render: (_, record) => (isOwner(record) ? (
                <Typography.Text type="secondary">{t('common.protected')}</Typography.Text>
              ) : (
                <Space size={4}>
                  <Tooltip title={t('team.members.editAccess')}>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      aria-label={`${t('team.members.editAccess')} ${record.username}`}
                      onClick={() => onEdit(record)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title={t('team.members.deactivateTitle')}
                    description={t('team.members.deactivateDescription')}
                    okText={t('team.members.deactivate')}
                    okButtonProps={{ danger: true }}
                    onConfirm={() => onDeactivate(record.id)}
                  >
                    <Tooltip title={t('team.members.deactivate')}>
                      <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        loading={isDeactivating && deactivatingMemberId === record.id}
                        aria-label={`${t('team.members.deactivate')} ${record.username}`}
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