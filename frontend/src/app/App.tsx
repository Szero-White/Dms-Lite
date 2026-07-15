import { App as AntApp, ConfigProvider, theme } from 'antd';
import { AppProviders } from './providers';
import { AppRouter } from './router';

function AppShell() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          /* Brand */
          colorPrimary: '#6366f1',
          colorPrimaryHover: '#4f46e5',
          colorPrimaryActive: '#4338ca',
          colorPrimaryBg: '#eef2ff',
          colorPrimaryBgHover: '#e0e7ff',
          colorPrimaryBorder: '#c7d2fe',
          colorPrimaryBorderHover: '#a5b4fc',

          /* Semantic */
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorInfo: '#6366f1',

          /* Background */
          colorBgLayout: '#f1f5f9',
          colorBgContainer: '#ffffff',
          colorBgElevated: '#ffffff',
          colorBgSpotlight: '#1e293b',
          colorFillSecondary: '#f8fafc',
          colorFillTertiary: '#f1f5f9',
          colorFillQuaternary: '#e8ecf4',

          /* Border */
          colorBorder: '#e2e8f0',
          colorBorderSecondary: '#f1f5f9',
          colorSplit: '#f1f5f9',

          /* Text */
          colorText: '#0f172a',
          colorTextSecondary: '#64748b',
          colorTextTertiary: '#94a3b8',
          colorTextQuaternary: '#cbd5e1',
          colorTextPlaceholder: '#94a3b8',
          colorTextDisabled: '#cbd5e1',
          colorTextHeading: '#0f172a',
          colorTextLabel: '#475569',
          colorTextDescription: '#64748b',

          /* Typography */
          fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: 14,
          fontSizeSM: 12,
          fontSizeLG: 16,
          fontSizeXL: 18,
          fontSizeHeading1: 32,
          fontSizeHeading2: 26,
          fontSizeHeading3: 20,
          fontSizeHeading4: 16,
          fontSizeHeading5: 14,
          lineHeight: 1.6,
          lineHeightHeading1: 1.2,
          lineHeightHeading2: 1.25,
          lineHeightHeading3: 1.3,

          /* Shape */
          borderRadius: 10,
          borderRadiusLG: 14,
          borderRadiusSM: 8,
          borderRadiusXS: 6,
          borderRadiusOuter: 16,

          /* Sizes */
          controlHeight: 40,
          controlHeightSM: 32,
          controlHeightLG: 48,
          controlOutlineWidth: 3,
          controlOutline: 'rgba(99,102,241,0.12)',

          /* Shadows */
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
          boxShadowSecondary: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
          boxShadowTertiary: '0 0 0 3px rgba(99,102,241,0.12)',

          /* Spacing */
          padding: 16,
          paddingLG: 22,
          paddingXL: 28,
          paddingSM: 12,
          paddingXS: 8,
          paddingXXS: 4,
          margin: 16,
          marginLG: 22,
          marginXL: 28,
          marginSM: 12,
          marginXS: 8,
          marginXXS: 4,

          /* Motion */
          motionUnit: 0.065,
          motionBase: 0,
          motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
          motionEaseOut: 'cubic-bezier(0, 0, 0.2, 1)',
          motionEaseOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
        components: {
          Button: {
            borderRadius: 10,
            borderRadiusSM: 8,
            borderRadiusLG: 12,
            controlHeight: 40,
            controlHeightSM: 32,
            controlHeightLG: 48,
            fontWeight: 600,
            paddingInline: 18,
            paddingInlineSM: 12,
            paddingInlineLG: 22,
            primaryShadow: 'none',
            defaultShadow: 'none',
            dangerShadow: 'none',
          },
          Card: {
            borderRadiusLG: 16,
            headerFontSize: 15,
            headerFontSizeSM: 13,
            paddingLG: 22,
            headerHeight: 54,
            colorBorderSecondary: '#f1f5f9',
          },
          Drawer: {
            borderRadiusLG: 16,
            paddingLG: 24,
            footerPaddingBlock: 14,
            footerPaddingInline: 24,
          },
          Form: {
            labelFontSize: 13,
            labelColor: '#475569',
            itemMarginBottom: 18,
            verticalLabelPadding: '0 0 6px',
          },
          Input: {
            controlHeight: 40,
            controlHeightSM: 32,
            controlHeightLG: 48,
            borderRadius: 10,
            borderRadiusLG: 12,
            borderRadiusSM: 8,
            paddingInline: 13,
            paddingInlineSM: 9,
            paddingInlineLG: 15,
          },
          InputNumber: {
            controlHeight: 40,
            controlHeightSM: 32,
            controlHeightLG: 48,
            borderRadius: 10,
            paddingInline: 11,
          },
          Modal: {
            borderRadiusLG: 18,
            paddingLG: 24,
            paddingMD: 20,
            paddingContentHorizontalLG: 24,
            footerBg: '#fafbfc',
          },
          Pagination: {
            itemSize: 36,
            borderRadius: 8,
            fontWeightStrong: 600,
          },
          Select: {
            controlHeight: 40,
            controlHeightSM: 32,
            controlHeightLG: 48,
            borderRadius: 10,
            borderRadiusLG: 12,
            borderRadiusSM: 8,
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#64748b',
            headerSplitColor: 'transparent',
            headerSortActiveBg: '#f1f5f9',
            headerSortHoverBg: '#eef2ff',
            rowHoverBg: '#f5f7ff',
            rowSelectedBg: '#eef2ff',
            rowSelectedHoverBg: '#e0e7ff',
            borderColor: '#f1f5f9',
            borderRadiusLG: 14,
            cellPaddingBlock: 12,
            cellPaddingInline: 16,
            cellPaddingBlockSM: 8,
            cellPaddingInlineSM: 12,
          },
          Tag: {
            borderRadiusSM: 999,
          },
          Menu: {
            itemBorderRadius: 10,
            itemHeight: 40,
            itemMarginInline: 0,
            itemMarginBlock: 1,
            itemPaddingInline: 12,
            groupTitleFontSize: 10.5,
            subMenuItemBg: 'transparent',
          },
          Dropdown: {
            borderRadius: 12,
            borderRadiusLG: 14,
            paddingBlock: 6,
          },
          Segmented: {
            borderRadius: 10,
            borderRadiusLG: 12,
            borderRadiusSM: 8,
            itemSelectedBg: '#ffffff',
            trackBg: '#f1f5f9',
            trackPadding: 3,
          },
          Tabs: {
            borderRadius: 8,
            cardBg: '#f8fafc',
            itemSelectedColor: '#6366f1',
            inkBarColor: '#6366f1',
            itemHoverColor: '#6366f1',
          },
          Progress: {
            lineBorderRadius: 999,
          },
          Alert: {
            borderRadius: 12,
            borderRadiusLG: 14,
          },
          Badge: {
            colorBgContainer: '#ffffff',
          },
          Avatar: {
            borderRadius: 10,
            borderRadiusLG: 14,
            borderRadiusSM: 8,
          },
          Statistic: {
            titleFontSize: 13,
          },
          Timeline: {
            itemPaddingBottom: 20,
          },
          DatePicker: {
            controlHeight: 40,
            controlHeightSM: 32,
            controlHeightLG: 48,
            borderRadius: 10,
            paddingInline: 13,
          },
          Descriptions: {
            contentColor: '#0f172a',
            labelBg: '#f8fafc',
            labelColor: '#475569',
            borderRadius: 12,
            borderRadiusLG: 14,
          },
          List: {
            colorSplit: '#f1f5f9',
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
  return <AppShell />;
}
