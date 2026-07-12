import { App as AntApp, ConfigProvider, theme } from 'antd';
import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Providers } from './providers';
import { AppLayout } from '../components/layout/AppLayout/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { LoginPage } from '../pages/login/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ProductsPage } from '../pages/products/ProductsPage';
import { CustomersPage } from '../pages/customers/CustomersPage';
import { CustomerDetailPage } from '../pages/customers/CustomerDetailPage';
import { SalesOrdersPage } from '../pages/sales/SalesOrdersPage';
import { CreateSalesOrderPage } from '../pages/sales/CreateSalesOrderPage';
import { InventoryPage } from '../pages/inventory/InventoryPage';
import { PaymentsPage } from '../pages/payments/PaymentsPage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { AuditLogsPage } from '../pages/audit/AuditLogsPage';
import { NotificationsPage } from '../pages/notifications/NotificationsPage';

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
