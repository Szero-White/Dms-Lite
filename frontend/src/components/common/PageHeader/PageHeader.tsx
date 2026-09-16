import { PropsWithChildren } from 'react';
import { Breadcrumb, Space, Typography } from 'antd';
import styles from './PageHeader.module.css';

export type PageHeaderVariant =
  | 'default'
  | 'executive'
  | 'operations'
  | 'finance'
  | 'records'
  | 'catalog'
  | 'people'
  | 'inventory'
  | 'activity'
  | 'governance';

interface PageHeaderProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  breadcrumb?: string[];
  extra?: React.ReactNode;
  variant?: PageHeaderVariant;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  extra,
  variant = 'default',
  children,
}: PageHeaderProps) {
  return (
    <div className={`${styles.header} ${styles[`variant_${variant}`]}`}>
      <div className={styles.content}>
        {breadcrumb?.length ? (
          <Breadcrumb
            className={styles.breadcrumb}
            items={breadcrumb.map((item) => ({
              title: item,
            }))}
          />
        ) : null}

        <Space direction="vertical" size={4}>
          <Typography.Title
            level={2}
            className={styles.title}
          >
            {title}
          </Typography.Title>

          <Typography.Text
            type="secondary"
            className={styles.subtitle}
          >
            {subtitle}
          </Typography.Text>

          {children}
        </Space>
      </div>

      {extra ? (
        <div className={styles.extra}>{extra}</div>
      ) : null}
    </div>
  );
}
