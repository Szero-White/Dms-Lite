import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Button, Space, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import type { SalesOrder } from '../../../../types/sales.types';
import styles from './SalesOrderRowActions.module.css';

interface SalesOrderRowActionsProps {
  order: SalesOrder;
  canConfirm: boolean;
  canCancel: boolean;
  confirming: boolean;
  cancelling: boolean;
  onView: (order: SalesOrder) => void;
  onConfirm: (order: SalesOrder) => void;
  onCancel: (order: SalesOrder) => void;
}

export function SalesOrderRowActions({
  order,
  canConfirm,
  canCancel,
  confirming,
  cancelling,
  onView,
  onConfirm,
  onCancel,
}: SalesOrderRowActionsProps) {
  const { t } = useTranslation();
  const isDraft = order.status === 'DRAFT';

  return (
    <Space size={4} className={styles.actions}>
      <Tooltip title={t('sales.action.viewDetails')}>
        <Button
          type="text"
          icon={<EyeOutlined />}
          aria-label={t('sales.action.viewDetails')}
          onClick={() => onView(order)}
        />
      </Tooltip>

      {isDraft && canConfirm ? (
        <Tooltip title={t('sales.action.confirmOrder')}>
          <Button
            type="text"
            className={styles.confirmButton}
            icon={<CheckCircleOutlined />}
            loading={confirming}
            aria-label={t('sales.action.confirmOrder')}
            onClick={() => onConfirm(order)}
          />
        </Tooltip>
      ) : null}

      {isDraft && canCancel ? (
        <Tooltip title={t('sales.action.cancelOrder')}>
          <Button
            danger
            type="text"
            className={styles.cancelButton}
            icon={<CloseCircleOutlined />}
            loading={cancelling}
            aria-label={t('sales.action.cancelOrder')}
            onClick={() => onCancel(order)}
          />
        </Tooltip>
      ) : null}
    </Space>
  );
}
