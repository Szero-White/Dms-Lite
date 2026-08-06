import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCreateInvoice } from '../../hooks/useInvoiceQueries';
import { useCustomers } from '../../../customers/hooks/useCustomerQueries';
import { useProductList } from '../../../products/hooks/useProductQueries';
import type { CreateInvoicePayload, InvoiceItem } from '../../types/invoice.types';
import './CreateInvoicePage.module.css';

const INVOICE_DRAFT_STORAGE_KEY = 'dms.invoice.createDraft';

interface InvoiceDraftState {
  customerId: number | null;
  salesOrderId: number | null;
  issueDate: string;
  dueDate: string;
  taxRate: string;
  notes: string;
  items: InvoiceItem[];
}

function loadInvoiceDraft(): InvoiceDraftState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(INVOICE_DRAFT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<InvoiceDraftState>;

    return {
      customerId: typeof parsed.customerId === 'number' ? parsed.customerId : null,
      salesOrderId: typeof parsed.salesOrderId === 'number' ? parsed.salesOrderId : null,
      issueDate: parsed.issueDate || new Date().toISOString().split('T')[0],
      dueDate: parsed.dueDate || '',
      taxRate: parsed.taxRate || '',
      notes: parsed.notes || '',
      items: Array.isArray(parsed.items) && parsed.items.length > 0
        ? parsed.items
        : [{ productId: 0, quantity: 1, unitPrice: 0, discountAmount: 0 }],
    };
  } catch {
    return null;
  }
}

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const initialDraft = loadInvoiceDraft();
  const [customerId, setCustomerId] = useState<number | null>(initialDraft?.customerId ?? null);
  const [salesOrderId, setSalesOrderId] = useState<number | null>(initialDraft?.salesOrderId ?? null);
  const [issueDate, setIssueDate] = useState(initialDraft?.issueDate ?? new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(initialDraft?.dueDate ?? '');
  const [taxRate, setTaxRate] = useState(initialDraft?.taxRate ?? '');
  const [notes, setNotes] = useState(initialDraft?.notes ?? '');
  const [items, setItems] = useState<InvoiceItem[]>(initialDraft?.items ?? [
    { productId: 0, quantity: 1, unitPrice: 0, discountAmount: 0 },
  ]);

  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProductList();
  const createInvoiceMutation = useCreateInvoice();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const draft: InvoiceDraftState = {
      customerId,
      salesOrderId,
      issueDate,
      dueDate,
      taxRate,
      notes,
      items,
    };

    window.localStorage.setItem(INVOICE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [customerId, salesOrderId, issueDate, dueDate, taxRate, notes, items]);

  const clearDraft = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(INVOICE_DRAFT_STORAGE_KEY);
    }
  };

  const addItem = () => {
    setItems([...items, { productId: 0, quantity: 1, unitPrice: 0, discountAmount: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-fill unit price when product is selected
    if (field === 'productId' && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        updatedItems[index].unitPrice = Number(product.sellingPrice);
        updatedItems[index].productName = product.name;
        updatedItems[index].productCode = product.sku;
      }
    }
    
    setItems(updatedItems);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!customerId) {
      alert(t('invoice.create.validation.customerRequired'));
      return;
    }

    const validItems = items.filter(item => item.productId > 0 && item.quantity > 0);
    
    if (validItems.length === 0) {
      alert(t('invoice.create.validation.itemsRequired'));
      return;
    }

    const payload: CreateInvoicePayload = {
      customerId,
      salesOrderId: salesOrderId || undefined,
      issueDate: new Date(issueDate).toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      taxRate: taxRate || undefined,
      notes: notes || undefined,
      items: validItems,
    };

    createInvoiceMutation.mutate(payload, {
      onSuccess: (createdInvoice) => {
        clearDraft();
        navigate(`/invoices/${createdInvoice.id}`);
      },
      onError: (error) => {
        console.error('Failed to create invoice:', error);
        alert(t('invoice.create.failure'));
      },
    });
  };

  return (
    <div className="create-invoice-page">
      <div className="page-header">
        <h1>{t('invoice.create.title')}</h1>
        <button onClick={() => navigate(-1)} className="btn-secondary">
          {t('invoice.create.back')}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="invoice-form">
        <div className="form-section">
          <h2>{t('invoice.create.basicInfo')}</h2>
          
          <div className="form-group">
            <label htmlFor="customer">{t('invoice.create.customer')} *</label>
            <select
              id="customer"
              value={customerId || ''}
              onChange={(e) => setCustomerId(Number(e.target.value))}
              required
            >
              <option value="">{t('invoice.create.customerPlaceholder')}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="issueDate">{t('invoice.create.issueDate')} *</label>
            <input
              id="issueDate"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dueDate">{t('invoice.create.dueDate')}</label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="taxRate">{t('invoice.create.taxRate')}</label>
            <input
              id="taxRate"
              type="text"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder={t('invoice.create.taxRatePlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">{t('invoice.create.notes')}</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t('invoice.create.notesPlaceholder')}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>{t('invoice.create.itemsTitle')}</h2>
          
          {items.map((item, index) => (
            <div key={index} className="invoice-item">
              <div className="item-header">
                <span>{t('invoice.create.itemLabel', { index: index + 1 })}</span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="btn-sm btn-danger"
                  >
                    {t('invoice.create.removeItem')}
                  </button>
                )}
              </div>

              <div className="item-fields">
                <div className="form-group">
                  <label>{t('invoice.create.product')} *</label>
                  <select
                    value={item.productId || ''}
                    onChange={(e) => updateItem(index, 'productId', Number(e.target.value))}
                    required
                  >
                    <option value="">{t('invoice.create.productPlaceholder')}</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ${product.sellingPrice}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('invoice.create.quantity')} *</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t('invoice.create.unitPrice')} *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t('invoice.create.discount')}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.discountAmount || 0}
                    onChange={(e) => updateItem(index, 'discountAmount', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ))}

          <button type="button" onClick={addItem} className="btn-secondary">
            {t('invoice.create.addItem')}
          </button>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={createInvoiceMutation.isPending}
          >
            {createInvoiceMutation.isPending ? t('invoice.create.creating') : t('invoice.create.submit')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="btn-secondary"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}