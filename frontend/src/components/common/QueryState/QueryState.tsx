import { Alert, Empty, Spin } from 'antd';
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
        <Spin size="large" />
      </div>
    );
  }

  if (isError) {
    return (
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
    );
  }

  if (!hasData) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No data yet"
      />
    );
  }

  return <>{children}</>;
}
