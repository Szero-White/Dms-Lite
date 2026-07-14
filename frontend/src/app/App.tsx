import { App as AntApp, ConfigProvider, theme } from 'antd';
import { AppProviders } from './providers';
import { AppRouter } from './router';

function AppShell() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3156d3',
          colorPrimaryHover: '#2848b8',
          colorBgLayout: '#f5f7fb',
          colorBgContainer: '#ffffff',
          colorBorder: '#e7eaf0',
          colorText: '#172033',
          colorTextSecondary: '#667085',
          colorTextTertiary: '#98a2b3',
          borderRadius: 8,
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
          boxShadow: '0 5px 18px rgba(30, 41, 59, 0.045)',
        },
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 40,
            fontWeight: 500,
          },
          Card: {
            borderRadiusLG: 14,
            headerFontSize: 15,
          },
          Drawer: {
            borderRadiusLG: 14,
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
            borderRadiusLG: 14,
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
