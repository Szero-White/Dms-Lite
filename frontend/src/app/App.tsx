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
          borderRadius: 8,
          borderRadiusLG: 12,
          borderRadiusSM: 8,
          fontFamily: '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: 14,
          fontSizeSM: 12,
          fontSizeLG: 16,
          lineHeight: 1.5715,
          controlHeight: 36,
          controlHeightSM: 28,
          controlHeightLG: 40,
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
