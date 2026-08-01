import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Switch,
} from 'antd';
import type { FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import type {
  TeamMember,
  TeamMemberFormValues,
} from '../../../types/team.types';
import styles from '../TeamPage.module.css';

interface RoleSelectOption {
  value: string;
  label: string;
}

interface TeamMemberDrawerProps {
  form: FormInstance<TeamMemberFormValues>;
  open: boolean;
  selectedMember: TeamMember | null;
  roleOptions: RoleSelectOption[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: TeamMemberFormValues) => void;
}

export function TeamMemberDrawer({
  form,
  open,
  selectedMember,
  roleOptions,
  submitting,
  onClose,
  onSubmit,
}: TeamMemberDrawerProps) {
  const { t } = useTranslation();

  return (
    <Drawer
      title={selectedMember ? t('team.drawer.member.editTitle') : t('team.drawer.member.createTitle')}
      width={440}
      open={open}
      onClose={onClose}
      afterOpenChange={(visible) => {
        if (visible) {
          form.setFieldsValue(selectedMember ? {
            fullName: selectedMember.fullName,
            roles: selectedMember.roles.filter((role) => role !== 'OWNER'),
            active: selectedMember.active,
          } : {
            active: true,
            roles: [],
          });
        } else {
          form.resetFields();
        }
      }}
      footer={(
        <div className={styles.drawerFooter}>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="primary" loading={submitting} onClick={() => form.submit()}>
            {t('common.save')}
          </Button>
        </div>
      )}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        {!selectedMember ? (
          <Form.Item
            label={t('team.drawer.username')}
            name="username"
            rules={[{ required: true, message: t('team.drawer.usernameRequired') }]}
          >
            <Input placeholder={t('team.drawer.usernamePlaceholder')} autoComplete="off" />
          </Form.Item>
        ) : null}
        <Form.Item
          label={t('team.drawer.fullName')}
          name="fullName"
          rules={[{ required: true, message: t('team.drawer.fullNameRequired') }]}
        >
          <Input placeholder={t('team.drawer.fullNamePlaceholder')} />
        </Form.Item>
        {!selectedMember ? (
          <Form.Item
            label={t('team.drawer.temporaryPassword')}
            name="password"
            rules={[{ required: true, min: 8, message: t('team.drawer.passwordRequired') }]}
          >
            <Input.Password placeholder={t('team.drawer.passwordPlaceholder')} autoComplete="new-password" />
          </Form.Item>
        ) : null}
        <Form.Item
          label={t('team.drawer.roles')}
          name="roles"
          rules={[{ required: true, message: t('team.drawer.roleRequired') }]}
        >
          <Select mode="multiple" options={roleOptions} placeholder={t('team.drawer.rolePlaceholder')} />
        </Form.Item>
        <Form.Item label={t('team.drawer.activeAccount')} name="active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
}