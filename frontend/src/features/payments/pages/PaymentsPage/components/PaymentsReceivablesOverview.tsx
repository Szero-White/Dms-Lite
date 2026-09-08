import { QueryState } from '../../../../../components/common/QueryState';
import { useCustomers } from '../../../../customers';
import { formatCurrency, toNumber } from '../../../../../lib/format';
import { useTranslation } from 'react-i18next';
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
  const debtorRatio = activeCustomers.length > 0
    ? activeCustomers.filter((customer) => toNumber(customer.debtBalance) > 0).length / activeCustomers.length
    : 0;
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
        <div className={heroStyles.heroLeft}>
          <div className={heroStyles.heroCard}>
            <div className={heroStyles.heroCardInner}>
              <div className={heroStyles.ringWrap}>
                <svg viewBox="0 0 120 120" className={heroStyles.ring}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="url(#rg)"
                    strokeWidth="10"
                    strokeDasharray={`${debtorRatio * 314} 314`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <defs>
                    <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className={heroStyles.ringCenter}>
                  <span className={heroStyles.ringPct}>{Math.round(debtorRatio * 100)}%</span>
                  <span className={heroStyles.ringLabel}>{t('payments.hero.haveDebt')}</span>
                </div>
              </div>

              <div className={heroStyles.heroMain}>
                <div className={heroStyles.heroEyebrow}>{t('payments.hero.totalReceivables')}</div>
                <div className={heroStyles.heroAmount}>{formatCurrency(totalReceivables)}</div>
                <div className={heroStyles.heroMiniStats}>
                  <div className={heroStyles.miniStat}>
                    <span className={`${heroStyles.miniDot} ${heroStyles.red}`} />
                    <div><strong>{debtors.length}</strong><span>{t('payments.hero.debtors')}</span></div>
                  </div>
                  <div className={heroStyles.miniStat}>
                    <span className={`${heroStyles.miniDot} ${heroStyles.green}`} />
                    <div><strong>{formatCurrency(availableCredit)}</strong><span>{t('payments.hero.availableCredit')}</span></div>
                  </div>
                  <div className={heroStyles.miniStat}>
                    <span className={`${heroStyles.miniDot} ${heroStyles.blue}`} />
                    <div><strong>{activeCustomers.length}</strong><span>{t('payments.hero.activeAccounts')}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={heroStyles.heroRight}>
          <div className={heroStyles.topDebtorsCard}>
            <div className={heroStyles.topDebtorsHeader}>
              <span>{t('payments.hero.topDebtors')}</span>
              <span className={heroStyles.topDebtorsCount}>{t('payments.hero.accounts', { count: debtors.length })}</span>
            </div>
            <div className={heroStyles.barList}>
              {topDebtors.map((debtor, index) => {
                const percent = maxDebt > 0 ? (toNumber(debtor.debtBalance) / maxDebt) * 100 : 0;
                return (
                  <div key={debtor.id} className={heroStyles.barRow}>
                    <div className={heroStyles.barMeta}>
                      <span className={heroStyles.barRank}>{index + 1}</span>
                      <span className={heroStyles.barName}>{debtor.name}</span>
                      <span className={heroStyles.barAmt}>{formatCurrency(debtor.debtBalance)}</span>
                    </div>
                    <div className={heroStyles.barTrack}>
                      <div
                        className={heroStyles.barFill}
                        style={{
                          width: `${percent}%`,
                          background: index === 0
                            ? 'linear-gradient(90deg,#ef4444,#f97316)'
                            : index === 1
                              ? 'linear-gradient(90deg,#f97316,#fbbf24)'
                              : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {debtors.length === 0 ? (
                <div className={heroStyles.barEmpty}>{t('payments.hero.noOutstandingDebts')}</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </QueryState>
  );
}
