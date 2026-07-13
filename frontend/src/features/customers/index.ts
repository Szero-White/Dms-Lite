export {
  fetchCustomerDebtStatement,
  fetchCustomersContent,
} from './api/customerService';
export {
  useCreateCustomer,
  useCustomerDebtStatement,
  useCustomers,
} from './hooks/useCustomerQueries';
export { CustomerDetailPage } from './pages/CustomerDetailPage';
export { CustomersPage } from './pages/CustomersPage';
export type {
  Customer,
  CustomerFormValues,
  DebtTransaction,
} from './types/customer.types';
