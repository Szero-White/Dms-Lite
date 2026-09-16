import { EditOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Space, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ProductRow } from '../../../../types/product.types';
import styles from './ProductRowActions.module.css';

interface ProductRowActionsProps {
  canManageProducts: boolean;
  changingStatusProductId?: number;
  onDeactivate: (productId: number) => void;
  onEdit: (product: ProductRow) => void;
  onReactivate: (productId: number) => void;
  product: ProductRow;
}

export function ProductRowActions({
  canManageProducts,
  changingStatusProductId,
  onDeactivate,
  onEdit,
  onReactivate,
  product,
}: ProductRowActionsProps) {
  const { t } = useTranslation();

  if (!canManageProducts) {
    return null;
  }

  return (
    <Space size={2} className={styles.actions}>
      <Tooltip title={t('products.action.edit')}>
        <Button
          type="text"
          icon={<EditOutlined />}
          aria-label={t('products.action.editAria', { name: product.name })}
          onClick={() => onEdit(product)}
        />
      </Tooltip>

      {product.active ? (
        <Popconfirm
          title={t('products.deactivate.title')}
          description={t('products.deactivate.description')}
          okText={t('products.action.deactivate')}
          okButtonProps={{ danger: true }}
          onConfirm={() => onDeactivate(product.id)}
        >
          <Tooltip title={t('products.action.deactivate')}>
            <Button
              danger
              type="text"
              icon={<StopOutlined />}
              loading={changingStatusProductId === product.id}
              aria-label={t('products.action.deactivateAria', { name: product.name })}
            />
          </Tooltip>
        </Popconfirm>
      ) : (
        <Tooltip title={t('products.action.reactivate')}>
          <Button
            type="text"
            icon={<PlayCircleOutlined />}
            loading={changingStatusProductId === product.id}
            aria-label={t('products.action.reactivateAria', { name: product.name })}
            onClick={() => onReactivate(product.id)}
          />
        </Tooltip>
      )}
    </Space>
  );
}
