import { Drawer, Layout } from 'antd';
import {
  type PropsWithChildren,
  useState,
} from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '../AppHeader';
import { AppSidebar } from '../AppSidebar';
import styles from './AppLayout.module.css';

const SIDEBAR_WIDTH = 232;
const SIDEBAR_COLLAPSED_WIDTH = 72;

export function AppLayout({
  children,
}: PropsWithChildren) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <Layout className={styles.layout}>
      <Layout.Sider
        width={SIDEBAR_WIDTH}
        collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
        collapsed={sidebarCollapsed}
        trigger={null}
        theme="light"
        className={styles.sidebar}
      >
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
        />
      </Layout.Sider>

      <Drawer
        placement="left"
        width={280}
        open={mobileNavigationOpen}
        closable={false}
        rootClassName={styles.mobileDrawer}
        onClose={() => setMobileNavigationOpen(false)}
      >
        <AppSidebar
          onNavigate={() => setMobileNavigationOpen(false)}
        />
      </Drawer>

      <Layout className={styles.main}>
        <Layout.Header className={styles.header}>
          <AppHeader
            onOpenNavigation={() => setMobileNavigationOpen(true)}
          />
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
