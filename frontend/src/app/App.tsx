import { App as AntApp, ConfigProvider, theme } from 'antd';
import { AppProviders } from './providers';
import { AppRouter } from './router';

function AppShell() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          colorPrimaryHover: '#4f46e5',
          colorPrimaryActive: '#4338ca',
          colorBgLayout: '#f8fafc',
          colorBgContainer: '#ffffff',
          colorBgElevated: '#ffffff',
          colorBorder: '#e2e8f0',
          colorBorderSecondary: '#f1f5f9',
          colorText: '#0f172a',
          colorTextSecondary: '#64748b',
          colorTextTertiary: '#94a3b8',
          colorTextQuaternary: '#cbd5e1',
          borderRadius: 12,
          borderRadiusLG: 16,
          borderRadiusSM: 8,
          borderRadiusXS: 6,
          fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: 14,
          fontSizeSM: 12,
          fontSizeLG: 16,
          fontSizeXL: 18,
          lineHeight: 1.6,
          controlHeight: 42,
          controlHeightSM: 32,
          controlHeightLG: 48,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
          boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        },
        components: {
          Button: {
            borderRadius: 10,
            controlHeight: 42,
            controlHeightSM: 32,
            controlHeightLG: 48,
            fontWeight: 600,
            paddingInline: 20,
          },
          Card: {
            borderRadiusLG: 16,
            headerFontSize: 16,
            paddingLG: 24,
          },
          Drawer: {
            borderRadiusLG: 16,
            paddingLG: 24,
          },
          Form: {
            labelFontSize: 14,
            labelColor: '#64748b',
            itemMarginBottom: 20,
          },
          Input: {
            controlHeight: 42,
            controlHeightSM: 32,
            controlHeightLG: 48,
            borderRadius: 10,
            paddingInline: 14,
          },
          InputNumber: {
            controlHeight: 42,
            borderRadius: 10,
          },
          Modal: {
            borderRadiusLG: 16,
            paddingLG: 24,
          },
          Pagination: {
            itemSize: 36,
            borderRadius: 8,
            fontWeight: 500,
          },
          Select: {
            controlHeight: 42,
            controlHeightSM: 32,
            controlHeightLG: 48,
            borderRadius: 10,
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#64748b',
            headerSplitColor: '#e2e8f0',
            rowHoverBg: '#f1f5f9',
            borderColor: '#e2e8f0',
            borderRadiusLG: 12,
          },
          Tag: {
            borderRadiusSM: 6,
          },
          Menu: {
            itemBorderRadius: 8,
            itemHeight: 42,
            itemMarginInline: 4,
            itemPaddingInline: 12,
          },
          Dropdown: {
            borderRadius: 12,
            paddingBlock: 8,
            paddingInline: 4,
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
