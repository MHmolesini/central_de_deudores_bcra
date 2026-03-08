import styles from './BouncedChecksKPIs.module.css';
import type { BCRAChequesResponse } from '../../services/bcra';
import { DollarSign, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
    data: BCRAChequesResponse | null;
    currency: 'ARS' | 'USD' | 'ARS_REAL';
    exchangeRates: Record<string, number>;
    inflationIndex: Record<string, number>;
}

export function BouncedChecksKPIs({ data, currency, exchangeRates, inflationIndex }: Props) {
    const stats = useMemo(() => {
        if (!data || !data.results || !data.results.causales) {
            return { total: 0, paid: 0, rescueRate: 0, judicial: 0 };
        }

        let totalAmount = 0;
        let paidAmount = 0;
        let judicialCount = 0;

        data.results.causales.forEach(causal => {
            causal.entidades.forEach(ent => {
                ent.detalle.forEach(det => {
                    const amount = det.monto;
                    const dateStr = det.fechaRechazo;
                    const periodKey = dateStr.substring(0, 7);

                    let adjusted = amount;
                    if (currency === 'USD') {
                        const rate = exchangeRates[periodKey] || exchangeRates[Object.keys(exchangeRates).sort().pop() || ''];
                        adjusted = rate ? amount / rate : amount;
                    } else if (currency === 'ARS_REAL') {
                        const currentPeriodKey = Object.keys(inflationIndex).sort().pop();
                        const currentIndex = currentPeriodKey ? inflationIndex[currentPeriodKey] : null;
                        const historicalIndex = inflationIndex[periodKey];
                        if (currentIndex && historicalIndex) {
                            adjusted = amount * (currentIndex / historicalIndex);
                        }
                    }

                    totalAmount += adjusted;
                    if (det.fechaPago) {
                        paidAmount += adjusted;
                    }
                    if (det.procesoJud) {
                        judicialCount++;
                    }
                });
            });
        });

        const rescueRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

        return {
            total: totalAmount,
            paid: paidAmount,
            rescueRate,
            judicial: judicialCount
        };
    }, [data, currency, exchangeRates, inflationIndex]);

    if (!data || stats.total === 0) return null;

    const formatValue = (val: number) => {
        return val.toLocaleString('es-AR', {
            maximumFractionDigits: currency === 'USD' ? 2 : 0
        });
    };

    const currencyPrefix = currency === 'USD' ? 'USD ' : '$ ';
    const currencySuffix = currency === 'USD' ? '' : 'M';

    return (
        <div className={styles.grid}>
            <div className={styles.card}>
                <div className={`${styles.iconWrapper} ${styles.blue}`}>
                    <DollarSign size={20} />
                </div>
                <div className={styles.content}>
                    <span className={styles.label}>Total Rechazado</span>
                    <span className={styles.value}>{currencyPrefix}{formatValue(stats.total)}{currencySuffix}</span>
                </div>
            </div>

            <div className={styles.card}>
                <div className={`${styles.iconWrapper} ${styles.green}`}>
                    <CheckCircle2 size={20} />
                </div>
                <div className={styles.content}>
                    <span className={styles.label}>Total Regularizado</span>
                    <span className={styles.value}>{currencyPrefix}{formatValue(stats.paid)}{currencySuffix}</span>
                </div>
            </div>

            <div className={styles.card}>
                <div className={`${styles.iconWrapper} ${styles.purple}`}>
                    <TrendingUp size={20} />
                </div>
                <div className={styles.content}>
                    <span className={styles.label}>Tasa de Rescate</span>
                    <span className={styles.value}>{stats.rescueRate.toFixed(1)}%</span>
                </div>
            </div>

            <div className={styles.card}>
                <div className={`${styles.iconWrapper} ${styles.red}`}>
                    <AlertCircle size={20} />
                </div>
                <div className={styles.content}>
                    <span className={styles.label}>P. Judiciales</span>
                    <span className={styles.value}>{stats.judicial} <small>casos</small></span>
                </div>
            </div>
        </div>
    );
}
