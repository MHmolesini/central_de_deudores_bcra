import type { BCRAHistorialResponse, BCRAChequesResponse } from '../../services/bcra';
import { DebtChart } from './DebtChart';
import { AlertCircle, FileWarning, ShieldAlert } from 'lucide-react';
import styles from './Dashboard.module.css';

interface Props {
    historial: BCRAHistorialResponse | null;
    cheques: BCRAChequesResponse | null;
}

export function Dashboard({ historial, cheques }: Props) {
    if (!historial || !historial.results) return null;

    const { denominacion, identificacion, periodos } = historial.results;

    // Aggregate data for the summary cards
    const currentPeriod = periodos[0];
    const totalDebt = currentPeriod?.entidades.reduce((acc, curr) => acc + curr.monto, 0) || 0;

    // Check if any entity has flags
    const hasJudicialProcess = periodos.some(p => p.entidades.some(e => e.procesoJud));
    const hasRevision = periodos.some(p => p.entidades.some(e => e.enRevision));

    // Check info
    const totalCheques = cheques?.results?.causales?.reduce((acc, c) => acc + c.entidades.reduce((eAcc, e) => eAcc + e.detalle.length, 0), 0) || 0;

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <div>
                    <h2 className={styles.title}>{denominacion}</h2>
                    <p className={styles.subtitle}>CUIT/CUIL: {identificacion}</p>
                </div>

                {/* Chips for warning flags */}
                <div className={styles.flags}>
                    {hasJudicialProcess && (
                        <span className={`${styles.badge} ${styles.danger}`}>
                            <ShieldAlert size={14} /> Proceso Judicial
                        </span>
                    )}
                    {hasRevision && (
                        <span className={`${styles.badge} ${styles.warning}`}>
                            <AlertCircle size={14} /> En Revisión
                        </span>
                    )}
                    {totalCheques > 0 && (
                        <span className={`${styles.badge} ${styles.danger}`}>
                            <FileWarning size={14} /> Cheques Rechazados
                        </span>
                    )}
                </div>
            </header>

            <div className={styles.grid}>
                <div className={`${styles.card} ${styles.totalCard}`}>
                    <h3>Deuda Total (Último Mes)</h3>
                    <p className={styles.amount}>
                        ${totalDebt.toLocaleString('es-AR')}
                    </p>
                </div>

                <div className={`${styles.card} ${styles.chartCard}`}>
                    <h3>Evolución de Deuda por Entidad</h3>
                    <div className={styles.chartWrapper}>
                        <DebtChart data={periodos} />
                    </div>
                </div>
            </div>
        </div>
    );
}
