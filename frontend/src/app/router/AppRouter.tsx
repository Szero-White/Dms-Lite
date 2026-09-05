import { Result, Skeleton } from 'antd';
import {
  lazy,
  Suspense,
  type ReactNode,
} from 'react';
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  useLocation,
} from 'react-router-dom';
import {
  NO_WORKSPACE_PATH,
  canAccessPath,
  firstAuthorizedPath,
  useAuth,
} from '../../features/auth';
import { useTranslation } from 'react-i18next';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';

const AIHistoryPage = lazy(() => import('../../features/help').then((module) => ({
  default: module.AIHistoryPage,
})));
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
const InvoicesPage = lazy(() => import('../../features/invoice').then((module) => ({
  default: module.InvoicesPage,
})));
const InvoiceDetailPage = lazy(() => import('../../features/invoice').then((module) => ({
  default: module.InvoiceDetailPage,
})));
const TeamPage = lazy(() => import('../../features/team').then((module) => ({
  default: module.TeamPage,
})));

function NoWorkspacePage() {
  const { t } = useTranslation();

  return (
    <Result
      status="403"
      title={t('access.noWorkspace.title')}
      subTitle={t('access.noWorkspace.description')}
    />
  );
}

function RootRedirect() {
  const { user } = useAuth();

  return <Navigate to={firstAuthorizedPath(user)} replace />;
}

function AuthorizedPage({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!canAccessPath(user, location.pathname)) {
    return <Navigate to={firstAuthorizedPath(user)} replace />;
  }

  return <>{children}</>;
}

function routeElement(element: ReactNode) {
  return (
    <AuthorizedPage>
      <Suspense
        fallback={(
          <div className="panel-card">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        )}
      >
        {element}
      </Suspense>
    </AuthorizedPage>
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
      { index: true, element: <RootRedirect /> },
      { path: NO_WORKSPACE_PATH.slice(1), element: <NoWorkspacePage /> },
      { path: 'dashboard', element: routeElement(<DashboardPage />) },
      { path: 'sales-orders', element: routeElement(<SalesOrdersPage />) },
      { path: 'sales-orders/new', element: routeElement(<CreateSalesOrderPage />) },
      { path: 'invoices', element: routeElement(<InvoicesPage />) },
      { path: 'invoices/:id', element: routeElement(<InvoiceDetailPage />) },
      { path: 'products', element: routeElement(<ProductsPage />) },
      { path: 'customers', element: routeElement(<CustomersPage />) },
      { path: 'customers/:customerId', element: routeElement(<CustomerDetailPage />) },
      { path: 'inventory', element: routeElement(<InventoryPage />) },
      { path: 'payments', element: routeElement(<PaymentsPage />) },
      { path: 'reports', element: routeElement(<ReportsPage />) },
      { path: 'audit-logs', element: routeElement(<AuditLogsPage />) },
      { path: 'team', element: routeElement(<TeamPage />) },
      { path: 'ai-history', element: routeElement(<AIHistoryPage />) },
      { path: 'notifications', element: routeElement(<NotificationsPage />) },
    ],
  },
  {
    path: '*',
    element: <RootRedirect />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
