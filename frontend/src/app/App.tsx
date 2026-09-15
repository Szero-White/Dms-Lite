import { App as AntApp, ConfigProvider } from 'antd';
import enUS from 'antd/es/locale/en_US';
import viVN from 'antd/es/locale/vi_VN';
import { useTranslation } from 'react-i18next';
import { appTheme } from './appTheme';
import { AppProviders } from './providers';
import { AppRouter } from './router';

function AppShell() {
  const { i18n } = useTranslation();
  const antdLocale = i18n.resolvedLanguage?.startsWith('vi') ? viVN : enUS;

  return (
    <ConfigProvider locale={antdLocale} theme={appTheme}>
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
