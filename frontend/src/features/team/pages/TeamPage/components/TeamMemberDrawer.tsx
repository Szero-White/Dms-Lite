import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Switch,
} from 'antd';
import type { FormInstance } from 'antd';
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
  return (
    <Drawer
      title={selectedMember ? 'Edit Team Member' : 'Create Team Member'}
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
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={() => form.submit()}>
            Save
          </Button>
        </div>
      )}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        {!selectedMember ? (
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Username is required' }]}
          >
            <Input placeholder="Ex: sales02" autoComplete="off" />
          </Form.Item>
        ) : null}
        <Form.Item
          label="Full name"
          name="fullName"
          rules={[{ required: true, message: 'Full name is required' }]}
        >
          <Input placeholder="Employee full name" />
        </Form.Item>
        {!selectedMember ? (
          <Form.Item
            label="Temporary password"
            name="password"
            rules={[{ required: true, min: 8, message: 'Password must be at least 8 characters' }]}
          >
            <Input.Password placeholder="At least 8 characters" autoComplete="new-password" />
          </Form.Item>
        ) : null}
        <Form.Item
          label="Roles"
          name="roles"
          rules={[{ required: true, message: 'Select at least one role' }]}
        >
          <Select mode="multiple" options={roleOptions} placeholder="Select staff role" />
        </Form.Item>
        <Form.Item label="Active account" name="active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
