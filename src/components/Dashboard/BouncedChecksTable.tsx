import styles from './BouncedChecksTable.module.css';
import type { BCRAChequesResponse } from '../../services/bcra';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Props {
    data: BCRAChequesResponse | null;
    currency: 'ARS' | 'USD' | 'ARS_REAL';
    exchangeRates: Record<string, number>;
    inflationIndex: Record<string, number>;
}

export function BouncedChecksTable({ data, currency, exchangeRates, inflationIndex }: Props) {
    if (!data || !data.results || !data.results.causales || data.results.causales.length === 0) {
        return null;
    }

    // Flatten the nested structure into a single array of rows
    const rows: {
        causal: string;
        entidad: number;
        nroCheque: number;
        fechaRechazo: string;
        monto: number;
        fechaPago: string | null;
        fechaPagoMulta: string | null;
        estadoMulta: string | null;
        procesoJud: boolean;
        enRevision: boolean;
    }[] = [];

    data.results.causales.forEach(causal => {
        causal.entidades.forEach(ent => {
            ent.detalle.forEach(det => {
                rows.push({
                    causal: causal.causal,
                    entidad: ent.entidad,
                    ...det
                });
            });
        });
    });

    // Sort by rejection date (newest first)
    rows.sort((a, b) => new Date(b.fechaRechazo).getTime() - new Date(a.fechaRechazo).getTime());

    // Helper to calculate converted amount
    const getAdjustedAmount = (amount: number, dateStr: string) => {
        if (currency === 'ARS') return amount;

        const periodKey = dateStr.substring(0, 7); // "YYYY-MM"

        if (currency === 'USD') {
            const rate = exchangeRates[periodKey] || exchangeRates[Object.keys(exchangeRates).sort().pop() || ''];
            return rate ? amount / rate : amount;
        }

        if (currency === 'ARS_REAL') {
            const currentPeriodKey = Object.keys(inflationIndex).sort().pop();
            const currentIndex = currentPeriodKey ? inflationIndex[currentPeriodKey] : null;
            const historicalIndex = inflationIndex[periodKey];

            if (currentIndex && historicalIndex) {
                return amount * (currentIndex / historicalIndex);
            }
        }

        return amount;
    };

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <div>
                    <h3 className={styles.title}>Cheques Rechazados</h3>
                    <p className={styles.subtitle}>Historial detallado de cheques rechazados</p>
                </div>
                <div className={styles.badgeCount}>
                    {rows.length} {rows.length === 1 ? 'cheque' : 'cheques'} listados
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Fecha Rechazo</th>
                            <th>Nro. Cheque</th>
                            <th>Causal</th>
                            <th>Entidad</th>
                            <th className={styles.numberCol}>Monto</th>
                            <th>Fecha Pago</th>
                            <th>Multa</th>
                            <th>Proceso Jud.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => {
                            const adjustedAmount = getAdjustedAmount(row.monto, row.fechaRechazo);
                            const amountStr = `${currency === 'USD' ? 'USD ' : '$ '} ${adjustedAmount.toLocaleString('es-AR', {
                                maximumFractionDigits: currency === 'USD' ? 2 : 0
                            })} ${currency === 'USD' ? '' : ''}`;

                            return (
                                <tr key={idx} className={styles.row}>
                                    <td className={styles.dateCol}>{row.fechaRechazo}</td>
                                    <td className={styles.idCol}>#{row.nroCheque}</td>
                                    <td>
                                        <span className={styles.causalBadge}>{row.causal}</span>
                                    </td>
                                    <td className={styles.entidadCol}>Entidad {row.entidad}</td>
                                    <td className={styles.amountCol}>{amountStr}</td>
                                    <td className={styles.dateCol}>
                                        {row.fechaPago ? (
                                            <span className={styles.success}>
                                                <CheckCircle size={14} /> {row.fechaPago}
                                            </span>
                                        ) : (
                                            <span className={styles.pending}>Impago</span>
                                        )}
                                    </td>
                                    <td>
                                        {row.estadoMulta === 'IMPAGA' ? (
                                            <span className={styles.danger}>
                                                <XCircle size={14} /> Impaga
                                            </span>
                                        ) : row.fechaPagoMulta ? (
                                            <span className={styles.success}>
                                                <CheckCircle size={14} /> Pagada ({row.fechaPagoMulta})
                                            </span>
                                        ) : (
                                            <span className={styles.muted}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        {row.procesoJud ? (
                                            <span className={styles.dangerBadge}>
                                                <AlertTriangle size={14} /> Sí
                                            </span>
                                        ) : (
                                            <span className={styles.muted}>No</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
