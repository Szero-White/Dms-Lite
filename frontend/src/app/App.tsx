import { App as AntApp, ConfigProvider, theme } from 'antd';
import { AppProviders } from './providers';
import { AppRouter } from './router';

function AppShell() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#2563eb',
          colorPrimaryHover: '#1d4ed8',
          colorBgLayout: '#f6f8fc',
          colorBgContainer: '#ffffff',
          colorBorder: '#e6eaf0',
          colorText: '#24324a',
          colorTextSecondary: '#667085',
          colorTextTertiary: '#98a2b3',
          borderRadius: 10,
          borderRadiusLG: 14,
          borderRadiusSM: 8,
          fontFamily: '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: 14,
          fontSizeSM: 12,
          fontSizeLG: 16,
          lineHeight: 1.5715,
          controlHeight: 40,
          controlHeightSM: 28,
          controlHeightLG: 44,
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
        },
        components: {
          Button: {
            borderRadius: 10,
            controlHeight: 40,
            fontWeight: 500,
          },
          Card: {
            borderRadiusLG: 16,
            headerFontSize: 16,
          },
          Drawer: {
            borderRadiusLG: 16,
          },
          Form: {
            labelFontSize: 14,
          },
          Input: {
            controlHeight: 40,
          },
          InputNumber: {
            controlHeight: 40,
          },
          Modal: {
            borderRadiusLG: 16,
          },
          Pagination: {
            itemSize: 32,
            borderRadius: 10,
          },
          Select: {
            controlHeight: 40,
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#667085',
            rowHoverBg: '#f3f7ff',
          },
          Tag: {
            borderRadiusSM: 999,
          },
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
