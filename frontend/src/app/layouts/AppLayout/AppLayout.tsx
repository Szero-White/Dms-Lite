import { Layout } from 'antd';
import type { PropsWithChildren } from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '../AppHeader';
import { AppSidebar } from '../AppSidebar';
import styles from './AppLayout.module.css';

const SIDEBAR_WIDTH = 224;

export function AppLayout({
  children,
}: PropsWithChildren) {
  return (
    <Layout className={styles.layout}>
      <Layout.Sider
        width={SIDEBAR_WIDTH}
        theme="light"
        className={styles.sidebar}
      >
        <AppSidebar />
      </Layout.Sider>

      <Layout className={styles.main}>
        <Layout.Header className={styles.header}>
          <AppHeader />
        </Layout.Header>

        <Layout.Content className={styles.content}>
          <div className={styles.page}>
            {children ?? <Outlet />}
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
