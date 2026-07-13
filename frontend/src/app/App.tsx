import { App as AntApp, ConfigProvider, theme } from 'antd';
import { AppProviders } from './providers';
import { AppRouter } from './router';

function AppShell() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1f6feb',
          colorBgLayout: '#f4f7fb',
          borderRadius: 14,
          fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
        },
      }}
    >
      <AntApp>
        <AppProviders>
          <AppRouter />
        </AppProviders>
      </AntApp>
    </ConfigProvider>
  );
}

export function App() {
  return (
    <AppShell />
  );
}
