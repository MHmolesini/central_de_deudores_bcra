import styles from './BouncedChecksTable.module.css';
import type { BCRAChequesResponse } from '../../services/bcra';
import { AlertTriangle, CheckCircle, XCircle, User, Briefcase, Search } from 'lucide-react';

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
        ctaPersonal: boolean;
        denomJuridica: string | null;
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

    // Helper to get color class for causal
    const getCausalClass = (causal: string) => {
        const c = causal.toUpperCase();
        if (c.includes('SIN FONDOS')) return styles.causalSinFondos;
        if (c.includes('DEFECTOS FORMALES')) return styles.causalDefectos;
        if (c.includes('ORDEN DE NO PAGAR')) return styles.causalOrden;
        if (c.includes('EXCESO DE ENDOSOS')) return styles.causalEndosos;
        if (c.includes('FUERA DE TÉRMINO')) return styles.causalTermino;
        if (c.includes('TRANSACCIÓN DUPLICADA')) return styles.causalDuplicada;
        if (c.includes('CUENTA CERRADA')) return styles.causalCerrada;
        return '';
    };

    const causalesInfo = [
        { id: 'R10', name: 'SIN FONDOS', desc: 'No hay fondos suficientes o autorización de descubierto.', class: styles.causalSinFondos },
        { id: 'R06', name: 'DEFECTOS FORMALES', desc: 'Error en fecha, firma, beneficiario o escritura.', class: styles.causalDefectos },
        { id: 'R08', name: 'ORDEN DE NO PAGAR', desc: 'El librador puso una denuncia (robo, extravío, coacción).', class: styles.causalOrden },
        { id: 'R11', name: 'EXCESO DE ENDOSOS', desc: 'El cheque tiene más endosos de los permitidos por ley.', class: styles.causalEndosos },
        { id: 'R15', name: 'FUERA DE TÉRMINO', desc: 'Presentado después de los 30 días de su emisión.', class: styles.causalTermino },
        { id: 'R24', name: 'TRANSACCIÓN DUPLICADA', desc: 'Intento de cobrar el mismo echeq o cheque dos veces.', class: styles.causalDuplicada },
        { id: 'R30', name: 'CUENTA CERRADA', desc: 'La cuenta corriente ya no existe.', class: styles.causalCerrada },
    ];

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
                            <th>Fecha</th>
                            <th>Cheque</th>
                            <th>Causal</th>
                            <th>Entidad</th>
                            <th>Tipo Cuenta</th>
                            <th className={styles.numberCol}>Monto</th>
                            <th>Estado Pago</th>
                            <th>Multa</th>
                            <th>Rev. / Jud.</th>
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
                                        <span className={`${styles.causalBadge} ${getCausalClass(row.causal)}`}>
                                            {row.causal}
                                        </span>
                                    </td>
                                    <td className={styles.entidadCol}>Entidad {row.entidad}</td>
                                    <td>
                                        {row.ctaPersonal ? (
                                            <span className={styles.accountBadge} title="Cuenta Personal">
                                                <User size={12} /> Personal
                                            </span>
                                        ) : (
                                            <span className={`${styles.accountBadge} ${styles.business}`} title={row.denomJuridica || 'Cuenta Jurídica'}>
                                                <Briefcase size={12} /> Jurídica
                                            </span>
                                        )}
                                    </td>
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
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {row.enRevision && (
                                                <span className={styles.revisionBadge} title="En Revisión">
                                                    <Search size={12} /> Rev.
                                                </span>
                                            )}
                                            {row.procesoJud && (
                                                <span className={styles.dangerBadge} title="Proceso Judicial">
                                                    <AlertTriangle size={12} /> Jud.
                                                </span>
                                            )}
                                            {!row.enRevision && !row.procesoJud && <span className={styles.muted}>-</span>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className={styles.legend}>
                <h4 className={styles.legendTitle}>Referencia de Causales</h4>
                <div className={styles.legendGrid}>
                    {causalesInfo.map(info => (
                        <div key={info.id} className={styles.legendItem}>
                            <div className={styles.legendHeader}>
                                <span className={styles.legendCode}>{info.id}</span>
                                <span className={`${styles.legendName} ${info.class}`}>{info.name}</span>
                            </div>
                            <span className={styles.legendDesc}>{info.desc}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
