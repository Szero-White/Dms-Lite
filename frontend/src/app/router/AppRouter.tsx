import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom';
import { AuditLogsPage } from '../../features/audit';
import { CustomerDetailPage, CustomersPage } from '../../features/customers';
import { DashboardPage } from '../../features/dashboard';
import { InventoryPage } from '../../features/inventory';
import { NotificationsPage } from '../../features/notifications';
import { PaymentsPage } from '../../features/payments';
import { ProductsPage } from '../../features/products';
import { ReportsPage } from '../../features/reports';
import {
  CreateSalesOrderPage,
  SalesOrdersPage,
} from '../../features/sales';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';

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

export function AppRouter() {
  return <RouterProvider router={router} />;
}
