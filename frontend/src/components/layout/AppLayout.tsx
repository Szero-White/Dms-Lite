import { Layout } from 'antd';
import { PropsWithChildren } from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider width={260} theme="light" className="sider-shell">
        <AppSidebar />
      </Layout.Sider>
      <Layout>
        <Layout.Header className="header-shell">
          <AppHeader />
        </Layout.Header>
        <Layout.Content className="content-shell">
          <div className="page-shell">{children ?? <Outlet />}</div>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
