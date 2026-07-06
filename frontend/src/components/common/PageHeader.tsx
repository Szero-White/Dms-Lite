import { PropsWithChildren } from 'react';
import { Breadcrumb, Space, Typography } from 'antd';

interface PageHeaderProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  breadcrumb?: string[];
  extra?: React.ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumb, extra, children }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        {breadcrumb?.length ? <Breadcrumb items={breadcrumb.map((item) => ({ title: item }))} /> : null}
        <Space direction="vertical" size={4}>
          <Typography.Title level={2} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          <Typography.Text type="secondary">{subtitle}</Typography.Text>
          {children}
        </Space>
      </div>
      {extra ? <div>{extra}</div> : null}
    </div>
  );
}
