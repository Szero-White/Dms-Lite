import { Alert, Empty, Skeleton } from 'antd';
import styles from './QueryState.module.css';

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  hasData?: boolean;
  children: React.ReactNode;
}

export function QueryState({
  isLoading,
  isError,
  error,
  hasData = true,
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
        />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={styles.emptyBlock}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No data yet"
        />
      </div>
    );
  }

  return <>{children}</>;
}
