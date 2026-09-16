import { SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Table } from 'antd';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { QueryState } from '../../../../../../components/common/QueryState';
import { TableMultiSelectFilter } from '../../../../../../components/common/TableMultiSelectFilter';
import {
  TABLE_SORT_DIRECTIONS,
  TABLE_SORTER_TOOLTIP,
} from '../../../../../../lib/tableSorting';
import type { ProductRow } from '../../../../types/product.types';
import styles from './ProductsTableCard.module.css';
import { useProductTableColumns } from './useProductTableColumns';

interface ProductsTableCardProps {
  canManageProducts: boolean;
  changingStatusProductId?: number;
  filteredProducts: ProductRow[];
  hasFilters: boolean;
  isError: boolean;
  isLoading: boolean;
  keyword: string;
  onClearFilters: () => void;
  onDeactivateProduct: (productId: number) => void;
  onKeywordChange: (value: string) => void;
  onReactivateProduct: (productId: number) => void;
  onRetry: () => void;
  onSelectProduct: (product: ProductRow | null) => void;
  onSetDrawerOpen: (open: boolean) => void;
  onStatusFiltersChange: (values: Array<'ACTIVE' | 'INACTIVE'>) => void;
  onStockFiltersChange: (values: Array<'HEALTHY' | 'LOW_STOCK'>) => void;
  productsError: unknown;
  showFinancials: boolean;
  showInventory: boolean;
  statusFilters: Array<'ACTIVE' | 'INACTIVE'>;
  stockFilters: Array<'HEALTHY' | 'LOW_STOCK'>;
}

export function ProductsTableCard({
  canManageProducts,
  changingStatusProductId,
  filteredProducts,
  hasFilters,
  isError,
  isLoading,
  keyword,
  onClearFilters,
  onDeactivateProduct,
  onKeywordChange,
  onReactivateProduct,
  onRetry,
  onSelectProduct,
  onSetDrawerOpen,
  onStatusFiltersChange,
  onStockFiltersChange,
  productsError,
  showFinancials,
  showInventory,
  statusFilters,
  stockFilters,
}: ProductsTableCardProps) {
  const { t } = useTranslation();

  const openEditor = useCallback((product: ProductRow) => {
    if (!canManageProducts) {
      return;
    }
    onSelectProduct(product);
    onSetDrawerOpen(true);
  }, [canManageProducts, onSelectProduct, onSetDrawerOpen]);

  const columns = useProductTableColumns({
    canManageProducts,
    changingStatusProductId,
    onDeactivateProduct,
    onEditProduct: openEditor,
    onReactivateProduct,
    showFinancials,
    showInventory,
  });

  return (
    <Card className={`panel-card workspace-surface table-panel-card ${styles.tableCard}`}>
      <div className={styles.toolbar}>
        <div className={styles.filterControls}>
          <Input
            allowClear
            className={styles.search}
            prefix={<SearchOutlined />}
            placeholder={t('products.filters.searchPlaceholder')}
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
          />
          <TableMultiSelectFilter
            ariaLabel={t('products.filters.allStatuses')}
            className={styles.filter}
            value={statusFilters}
            onChange={onStatusFiltersChange}
            placeholder={t('products.filters.allStatuses')}
            options={[
              { value: 'ACTIVE', label: t('common.active') },
              { value: 'INACTIVE', label: t('common.inactive') },
            ]}
          />
          {showInventory ? (
            <TableMultiSelectFilter
              ariaLabel={t('products.filters.allStockHealth')}
              className={styles.filter}
              value={stockFilters}
              onChange={onStockFiltersChange}
              placeholder={t('products.filters.allStockHealth')}
              options={[
                { value: 'HEALTHY', label: t('products.filters.healthyStock') },
                { value: 'LOW_STOCK', label: t('status.product.lowStock') },
              ]}
            />
          ) : null}
        </div>
        <Button disabled={!hasFilters} onClick={onClearFilters}>
          {t('common.clearFilters')}
        </Button>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={productsError}
        hasData={filteredProducts.length > 0}
        emptyTitle={hasFilters ? t('products.empty.filteredTitle') : t('products.empty.title')}
        emptyDescription={
          hasFilters
            ? t('products.empty.filteredDescription')
            : t('products.empty.description')
        }
        emptyAction={
          hasFilters ? (
            <Button onClick={onClearFilters}>{t('common.clearFilters')}</Button>
          ) : canManageProducts ? (
            <Button
              type="primary"
              onClick={() => {
                onSelectProduct(null);
                onSetDrawerOpen(true);
              }}
            >
              {t('products.action.new')}
            </Button>
          ) : null
        }
        onRetry={onRetry}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredProducts}
          scroll={{ x: 1180 }}
          sortDirections={TABLE_SORT_DIRECTIONS}
          showSorterTooltip={TABLE_SORTER_TOOLTIP}
          onRow={(record) => ({
            onDoubleClick: canManageProducts ? () => openEditor(record) : undefined,
          })}
        />
      </QueryState>
    </Card>
  );
}
