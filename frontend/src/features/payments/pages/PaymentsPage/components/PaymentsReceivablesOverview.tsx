import { CreditCardOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { QueryState } from '../../../../../components/common/QueryState';
import { formatCurrency, toNumber } from '../../../../../lib/format';
import { uiPalette } from '../../../../../styles/palette';
import { useCustomers } from '../../../../customers';
import heroStyles from '../PaymentsHero.module.css';

interface PaymentsReceivablesOverviewProps {
  enabled: boolean;
}

export function PaymentsReceivablesOverview({ enabled }: PaymentsReceivablesOverviewProps) {
  const { t } = useTranslation();
  const customersQuery = useCustomers({ enabled });
  const customers = customersQuery.data ?? [];
  const activeCustomers = customers.filter((customer) => customer.active);
  const debtors = customers
    .filter((customer) => toNumber(customer.debtBalance) > 0)
    .sort((first, second) => toNumber(second.debtBalance) - toNumber(first.debtBalance));
  const totalReceivables = customers.reduce(
    (total, customer) => total + toNumber(customer.debtBalance),
    0,
  );
  const availableCredit = activeCustomers.reduce(
    (total, customer) => total + Math.max(
      toNumber(customer.creditLimit) - toNumber(customer.debtBalance),
      0,
    ),
    0,
  );
  const topDebtors = debtors.slice(0, 5);
  const maxDebt = topDebtors.length > 0 ? toNumber(topDebtors[0].debtBalance) : 0;

  return (
    <QueryState
      isLoading={customersQuery.isLoading}
      isError={customersQuery.isError}
      error={customersQuery.error}
      hasData={Boolean(customers.length)}
      emptyTitle={t('payments.title')}
      emptyDescription={t('payments.empty.description')}
      onRetry={() => customersQuery.refetch()}
    >
      <div className={heroStyles.heroRow}>
        <section className={heroStyles.heroCard}>
          <div className={heroStyles.heroHeading}>
            <div className={heroStyles.heroIcon}><DollarOutlined /></div>
            <div>
              <span className={heroStyles.heroEyebrow}>{t('payments.hero.totalReceivables')}</span>
              <strong className={heroStyles.heroAmount}>{formatCurrency(totalReceivables)}</strong>
            </div>
          </div>

          <div className={heroStyles.heroMiniStats}>
            <div className={heroStyles.miniStat}>
              <span className={`${heroStyles.miniIcon} ${heroStyles.danger}`}><TeamOutlined /></span>
              <div><strong>{debtors.length}</strong><span>{t('payments.hero.debtors')}</span></div>
            </div>
            <div className={heroStyles.miniStat}>
              <span className={`${heroStyles.miniIcon} ${heroStyles.success}`}><CreditCardOutlined /></span>
              <div><strong>{formatCurrency(availableCredit)}</strong><span>{t('payments.hero.availableCredit')}</span></div>
            </div>
            <div className={heroStyles.miniStat}>
              <span className={`${heroStyles.miniIcon} ${heroStyles.brand}`}><TeamOutlined /></span>
              <div><strong>{activeCustomers.length}</strong><span>{t('payments.hero.activeAccounts')}</span></div>
            </div>
          </div>

        </section>

        <section className={heroStyles.topDebtorsCard}>
          <div className={heroStyles.topDebtorsHeader}>
            <span>{t('payments.hero.topDebtors')}</span>
            <span className={heroStyles.topDebtorsCount}>{t('payments.hero.accounts', { count: debtors.length })}</span>
          </div>
          <div className={heroStyles.barList}>
            {topDebtors.map((debtor, index) => {
              const percent = maxDebt > 0 ? (toNumber(debtor.debtBalance) / maxDebt) * 100 : 0;
              const color = index === 0
                ? uiPalette.semantic.danger
                : index === 1
                  ? uiPalette.brand.primary
                  : uiPalette.chart.neutral;

              return (
                <div key={debtor.id} className={heroStyles.barRow}>
                  <div className={heroStyles.barMeta}>
                    <span className={heroStyles.barRank}>{index + 1}</span>
                    <span className={heroStyles.barName}>{debtor.name}</span>
                    <span className={heroStyles.barAmt}>{formatCurrency(debtor.debtBalance)}</span>
                  </div>
                  <div className={heroStyles.barTrack}>
                    <div className={heroStyles.barFill} style={{ width: `${percent}%`, background: color }} />
                  </div>
                </div>
              );
            })}
            {debtors.length === 0 ? (
              <div className={heroStyles.barEmpty}>{t('payments.hero.noOutstandingDebts')}</div>
            ) : null}
          </div>
        </section>
      </div>
    </QueryState>
  );
}
