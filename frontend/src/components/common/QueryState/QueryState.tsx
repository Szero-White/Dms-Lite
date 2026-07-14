import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Skeleton } from 'antd';
import styles from './QueryState.module.css';

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  hasData?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function QueryState({
  isLoading,
  isError,
  error,
  hasData = true,
  emptyTitle = 'No data yet',
  emptyDescription,
  emptyAction,
  onRetry,
  children,
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div className={styles.stateBlock}>
        <Skeleton
          active
          paragraph={{ rows: 4 }}
          title={{ width: '42%' }}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.feedbackBlock}>
        <Alert
          type="error"
          message="Unable to load data"
          description={
            error instanceof Error
              ? error.message
              : 'Please try again.'
          }
          showIcon
          action={
            onRetry ? (
              <Button
                icon={<ReloadOutlined />}
                onClick={onRetry}
              >
                Retry
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={styles.emptyBlock}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={(
            <div className={styles.emptyContent}>
              <strong>{emptyTitle}</strong>
              {emptyDescription ? <span>{emptyDescription}</span> : null}
              {emptyAction ? <div className={styles.emptyAction}>{emptyAction}</div> : null}
            </div>
          )}
        />
      </div>
    );
  }

  return <>{children}</>;
}
