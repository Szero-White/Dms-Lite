import { App as AntApp, ConfigProvider, theme } from 'antd';
import { AppProviders } from './providers';
import { AppRouter } from './router';

function AppShell() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#4f6bed',
          colorPrimaryHover: '#4058c7',
          colorBgLayout: '#f4f6fa',
          colorBgContainer: '#ffffff',
          colorBorder: '#e7eaf0',
          colorText: '#20293a',
          colorTextSecondary: '#667085',
          colorTextTertiary: '#98a2b3',
          borderRadius: 8,
          borderRadiusLG: 12,
          borderRadiusSM: 8,
          fontFamily: '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: 14,
          fontSizeSM: 12,
          fontSizeLG: 16,
          lineHeight: 1.5715,
          controlHeight: 40,
          controlHeightSM: 28,
          controlHeightLG: 44,
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.035)',
        },
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 40,
            fontWeight: 500,
          },
          Card: {
            borderRadiusLG: 12,
            headerFontSize: 15,
          },
          Drawer: {
            borderRadiusLG: 12,
          },
          Form: {
            labelFontSize: 13,
          },
          Input: {
            controlHeight: 40,
          },
          InputNumber: {
            controlHeight: 40,
          },
          Modal: {
            borderRadiusLG: 12,
          },
          Pagination: {
            itemSize: 32,
            borderRadius: 8,
          },
          Select: {
            controlHeight: 40,
          },
          Table: {
            headerBg: '#f8f9fc',
            headerColor: '#667085',
            rowHoverBg: '#f7f8fc',
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
