import { Skeleton } from 'antd';
import {
  lazy,
  Suspense,
  type ReactNode,
} from 'react';
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';

const AuditLogsPage = lazy(() => import('../../features/audit').then((module) => ({
  default: module.AuditLogsPage,
})));
const CustomerDetailPage = lazy(() => import('../../features/customers').then((module) => ({
  default: module.CustomerDetailPage,
})));
const CustomersPage = lazy(() => import('../../features/customers').then((module) => ({
  default: module.CustomersPage,
})));
const DashboardPage = lazy(() => import('../../features/dashboard').then((module) => ({
  default: module.DashboardPage,
})));
const InventoryPage = lazy(() => import('../../features/inventory').then((module) => ({
  default: module.InventoryPage,
})));
const NotificationsPage = lazy(() => import('../../features/notifications').then((module) => ({
  default: module.NotificationsPage,
})));
const PaymentsPage = lazy(() => import('../../features/payments').then((module) => ({
  default: module.PaymentsPage,
})));
const ProductsPage = lazy(() => import('../../features/products').then((module) => ({
  default: module.ProductsPage,
})));
const ReportsPage = lazy(() => import('../../features/reports').then((module) => ({
  default: module.ReportsPage,
})));
const CreateSalesOrderPage = lazy(() => import('../../features/sales').then((module) => ({
  default: module.CreateSalesOrderPage,
})));
const SalesOrdersPage = lazy(() => import('../../features/sales').then((module) => ({
  default: module.SalesOrdersPage,
})));

function routeElement(element: ReactNode) {
  return (
    <Suspense
      fallback={(
        <div className="panel-card">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      )}
    >
      {element}
    </Suspense>
  );
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
      { path: 'dashboard', element: routeElement(<DashboardPage />) },
      { path: 'sales-orders', element: routeElement(<SalesOrdersPage />) },
      { path: 'sales-orders/new', element: routeElement(<CreateSalesOrderPage />) },
      { path: 'products', element: routeElement(<ProductsPage />) },
      { path: 'customers', element: routeElement(<CustomersPage />) },
      { path: 'customers/:customerId', element: routeElement(<CustomerDetailPage />) },
      { path: 'inventory', element: routeElement(<InventoryPage />) },
      { path: 'payments', element: routeElement(<PaymentsPage />) },
      { path: 'reports', element: routeElement(<ReportsPage />) },
      { path: 'audit-logs', element: routeElement(<AuditLogsPage />) },
      { path: 'notifications', element: routeElement(<NotificationsPage />) },
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
