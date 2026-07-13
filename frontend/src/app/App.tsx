import { App as AntApp, ConfigProvider, theme } from 'antd';
import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AuditLogsPage } from '../features/audit';
import { Providers } from './providers';
import { CustomerDetailPage, CustomersPage } from '../features/customers';
import { InventoryPage } from '../features/inventory';
import { NotificationsPage } from '../features/notifications';
import { PaymentsPage } from '../features/payments';
import { ProductsPage } from '../features/products';
import { DashboardPage } from '../features/dashboard';
import { ReportsPage } from '../features/reports';
import {
  CreateSalesOrderPage,
  SalesOrdersPage,
} from '../features/sales';
import { AppLayout } from '../components/layout';
import { useAuth } from '../hooks/useAuth';
import { LoginPage } from '../pages/login/LoginPage';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AppLayout><Outlet /></AppLayout> : <Navigate to="/login" replace />;
}

function PublicRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <PublicRoute />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'sales-orders', element: <SalesOrdersPage /> },
      { path: 'sales-orders/new', element: <CreateSalesOrderPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'customers/:customerId', element: <CustomerDetailPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

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
        <Providers>
          <RouterProvider router={router} />
        </Providers>
      </AntApp>
    </ConfigProvider>
  );
}

export function App() {
  return (
    <AppShell />
  );
}
