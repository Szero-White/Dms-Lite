import {
  Button,
  Checkbox,
  Drawer,
  Form,
  Input,
  Typography,
} from 'antd';
import type { FormInstance } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  PermissionOption,
  RoleFormValues,
  RoleOption,
} from '../../../types/team.types';
import {
  permissionDescription,
  permissionGroupLabel,
  permissionLabel,
} from '../permissionDisplay';
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

function getRoleDrawerTitle(mode: RoleDrawerMode, hasSelectedRole: boolean, t: (key: string) => string) {
  if (mode === 'view') {
    return t('team.drawer.role.viewTitle');
  }

  return hasSelectedRole ? t('team.drawer.role.editTitle') : t('team.drawer.role.createTitle');
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
  const { t } = useTranslation();
  const readOnly = mode === 'view';
  const permissionDependencies = useMemo(() => {
    const dependencyMap = new Map<string, string[]>();

    Object.values(permissionsByGroup)
      .flat()
      .forEach((permission) => dependencyMap.set(permission.name, permission.requires ?? []));

    return dependencyMap;
  }, [permissionsByGroup]);

  function expandPermissionDependencies(selectedPermissions: string[]) {
    const expanded = new Set(selectedPermissions);
    const queue = [...selectedPermissions];

    while (queue.length > 0) {
      const permission = queue.shift()!;
      for (const requiredPermission of permissionDependencies.get(permission) ?? []) {
        if (!expanded.has(requiredPermission)) {
          expanded.add(requiredPermission);
          queue.push(requiredPermission);
        }
      }
    }

    return Array.from(expanded);
  }

  return (
    <Drawer
      title={getRoleDrawerTitle(mode, Boolean(selectedRole), t)}
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
            permissions: [],
          });
        } else {
          form.resetFields();
        }
      }}
      footer={readOnly ? (
        <div className={styles.drawerFooter}>
          <Button type="primary" onClick={onClose}>{t('common.close')}</Button>
        </div>
      ) : (
        <div className={styles.drawerFooter}>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="primary" loading={submitting} onClick={() => form.submit()}>
            {t('team.drawer.role.save')}
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
          label={t('team.drawer.roleName')}
          name="name"
          rules={[{ required: true, message: t('team.drawer.roleNameRequired') }]}
        >
          <Input placeholder={t('team.drawer.roleNamePlaceholder')} />
        </Form.Item>
        <Form.Item
          label={t('team.drawer.permissions')}
          name="permissions"
          extra={readOnly ? undefined : t('team.drawer.permissionDependenciesHint')}
          getValueFromEvent={(values: string[]) => expandPermissionDependencies(values)}
          rules={[{ required: true, message: t('team.drawer.permissionRequired') }]}
        >
          <Checkbox.Group className={styles.permissionGroup}>
            {Object.entries(permissionsByGroup).map(([group, groupPermissionsValue]) => (
              <div key={group} className={styles.permissionSection}>
                <Typography.Text strong>{permissionGroupLabel(group, t)}</Typography.Text>
                <div className={styles.permissionGrid}>
                  {groupPermissionsValue.map((permission) => (
                    <Checkbox key={permission.name} value={permission.name}>
                      <span className={styles.permissionOption}>
                        <strong>{permissionLabel(permission.name, t)}</strong>
                        <small>{permissionDescription(permission, t)}</small>
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