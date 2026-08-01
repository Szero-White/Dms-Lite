import {
  Button,
  Checkbox,
  Drawer,
  Form,
  Input,
  Typography,
} from 'antd';
import type { FormInstance } from 'antd';
import type {
  PermissionOption,
  RoleFormValues,
  RoleOption,
} from '../../../types/team.types';
import styles from '../TeamPage.module.css';

export type RoleDrawerMode = 'create' | 'edit' | 'view';

interface RoleDrawerProps {
  form: FormInstance<RoleFormValues>;
  open: boolean;
  mode: RoleDrawerMode;
  selectedRole: RoleOption | null;
  permissionsByGroup: Record<string, PermissionOption[]>;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => void;
}

function getRoleDrawerTitle(mode: RoleDrawerMode, selectedRole: RoleOption | null) {
  if (mode === 'view') {
    return 'View Role';
  }

  return selectedRole ? 'Edit Custom Role' : 'Create Custom Role';
}

export function RoleDrawer({
  form,
  open,
  mode,
  selectedRole,
  permissionsByGroup,
  submitting,
  onClose,
  onSubmit,
}: RoleDrawerProps) {
  const readOnly = mode === 'view';

  return (
    <Drawer
      title={getRoleDrawerTitle(mode, selectedRole)}
      width={620}
      open={open}
      onClose={onClose}
      afterOpenChange={(visible) => {
        if (visible) {
          form.setFieldsValue(selectedRole ? {
            name: selectedRole.name,
            permissions: selectedRole.permissions,
          } : {
            name: '',
            permissions: [
              'AI_HELP_VIEW',
              'NOTIFICATION_VIEW',
            ],
          });
        } else {
          form.resetFields();
        }
      }}
      footer={readOnly ? (
        <div className={styles.drawerFooter}>
          <Button type="primary" onClick={onClose}>Close</Button>
        </div>
      ) : (
        <div className={styles.drawerFooter}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={() => form.submit()}>
            Save Role
          </Button>
        </div>
      )}
    >
      <Form
        form={form}
        layout="vertical"
        disabled={readOnly}
        onFinish={onSubmit}
      >
        <Form.Item
          label="Role name"
          name="name"
          rules={[{ required: true, message: 'Role name is required' }]}
        >
          <Input placeholder="Ex: Sales Manager, Purchasing, Cashier" />
        </Form.Item>
        <Form.Item
          label="Permissions"
          name="permissions"
          rules={[{ required: true, message: 'Select at least one permission' }]}
        >
          <Checkbox.Group className={styles.permissionGroup}>
            {Object.entries(permissionsByGroup).map(([group, groupPermissionsValue]) => (
              <div key={group} className={styles.permissionSection}>
                <Typography.Text strong>{group}</Typography.Text>
                <div className={styles.permissionGrid}>
                  {groupPermissionsValue.map((permission) => (
                    <Checkbox key={permission.name} value={permission.name}>
                      <span className={styles.permissionOption}>
                        <strong>{permission.label}</strong>
                        <small>{permission.description}</small>
                      </span>
                    </Checkbox>
                  ))}
                </div>
              </div>
            ))}
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </Drawer>
  );
}
