import { Alert, Empty, Spin } from 'antd';

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: any;
  hasData?: boolean;
  children: React.ReactNode;
}

export function QueryState({ isLoading, isError, error, hasData = true, children }: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="state-block">
        <Spin size="large" />
      </div>
    );
  }

  if (isError) {
    return <Alert type="error" message="Unable to load data" description={error?.message || 'Please try again.'} showIcon />;
  }

  if (!hasData) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data yet" />;
  }

  return <>{children}</>;
}
