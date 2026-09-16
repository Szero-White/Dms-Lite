import { Avatar, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ProductStatusTag } from '../../../../../../components/common/StatusTag';
import { formatCurrency, toNumber } from '../../../../../../lib/format';
import {
  compareBoolean,
  compareNumber,
  compareText,
} from '../../../../../../lib/tableSorting';
import type { ProductRow } from '../../../../types/product.types';
import { ProductRowActions } from '../ProductRowActions/ProductRowActions';
import styles from './ProductsTableCard.module.css';

interface ProductTableColumnsOptions {
  canManageProducts: boolean;
  changingStatusProductId?: number;
  onDeactivateProduct: (productId: number) => void;
  onEditProduct: (product: ProductRow) => void;
  onReactivateProduct: (productId: number) => void;
  showFinancials: boolean;
  showInventory: boolean;
}

function marginRatio(product: ProductRow) {
  const sellingPrice = toNumber(product.sellingPrice);
  if (sellingPrice <= 0) {
    return 0;
  }
  return (sellingPrice - toNumber(product.costPrice)) / sellingPrice;
}

export function useProductTableColumns({
  canManageProducts,
  changingStatusProductId,
  onDeactivateProduct,
  onEditProduct,
  onReactivateProduct,
  showFinancials,
  showInventory,
}: ProductTableColumnsOptions) {
  const { t } = useTranslation();

  return useMemo<TableColumnsType<ProductRow>>(() => [
    {
      title: t('products.column.product'),
      fixed: 'left',
      width: 300,
      ellipsis: true,
      sorter: (first, second) => compareText(first.name, second.name),
      render: (_, record) => (
        <div className={styles.productCell}>
          <Avatar shape="square" className={styles.productAvatar}>
            {record.name.slice(0, 2).toUpperCase()}
          </Avatar>
          <div>
            <Typography.Text strong>{record.name}</Typography.Text>
            <Typography.Text type="secondary">
              {record.barcode || t('products.noBarcode')}
            </Typography.Text>
          </div>
        </div>
      ),
    },
    {
      title: t('products.column.sku'),
      dataIndex: 'sku',
      width: 150,
      sorter: (first, second) => compareText(first.sku, second.sku),
      render: (value) => <span className={styles.sku}>{value}</span>,
    },
    ...(showFinancials ? [{
      title: t('products.column.costPrice'),
      dataIndex: 'costPrice',
      align: 'right' as const,
      width: 145,
      sorter: (first: ProductRow, second: ProductRow) => compareNumber(first.costPrice, second.costPrice),
      render: (value: string | number | null) => (
        <span className={styles.money}>{formatCurrency(value)}</span>
      ),
    }] : []),
    {
      title: t('products.column.sellingPrice'),
      dataIndex: 'sellingPrice',
      align: 'right' as const,
      width: 145,
      sorter: (first, second) => compareNumber(first.sellingPrice, second.sellingPrice),
      render: (value) => <span className={styles.money}>{formatCurrency(value)}</span>,
    },
    ...(showFinancials ? [{
      title: t('products.column.margin'),
      width: 110,
      align: 'right' as const,
      sorter: (first: ProductRow, second: ProductRow) => marginRatio(first) - marginRatio(second),
      render: (_: unknown, record: ProductRow) => (
        <span className={styles.money}>{(marginRatio(record) * 100).toFixed(1)}%</span>
      ),
    }] : []),
    ...(showInventory ? [{
      title: t('products.column.stockHealth'),
      width: 180,
      sorter: (first: ProductRow, second: ProductRow) => compareNumber(first.stock, second.stock),
      render: (_: unknown, record: ProductRow) => (
        <div className={styles.stockCell}>
          <Typography.Text strong>{record.stock}</Typography.Text>
          <Typography.Text type="secondary">
            {t('products.minStockShort', { count: record.minStock })}
          </Typography.Text>
        </div>
      ),
    }] : []),
    {
      title: t('common.status'),
      width: 145,
      sorter: (first, second) => compareBoolean(first.active, second.active),
      render: (_, record) => (
        <ProductStatusTag
          isLowStock={showInventory && record.active && record.isLowStock}
          active={record.active}
        />
      ),
    },
    {
      title: t('common.actions'),
      fixed: 'right',
      width: 92,
      render: (_, record) => (
        <ProductRowActions
          canManageProducts={canManageProducts}
          changingStatusProductId={changingStatusProductId}
          onDeactivate={onDeactivateProduct}
          onEdit={onEditProduct}
          onReactivate={onReactivateProduct}
          product={record}
        />
      ),
    },
  ], [
    canManageProducts,
    changingStatusProductId,
    onDeactivateProduct,
    onEditProduct,
    onReactivateProduct,
    showFinancials,
    showInventory,
    t,
  ]);
}
