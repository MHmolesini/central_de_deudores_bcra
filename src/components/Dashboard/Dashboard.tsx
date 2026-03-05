import type { BCRAHistorialResponse, BCRAChequesResponse } from '../../services/bcra';
import { DebtChart } from './DebtChart';
import { InflowChart } from './InflowChart';
import { StatusIndicator } from './StatusIndicator';
import { InfoSection } from './InfoSection';
import { AlertCircle, FileWarning, ShieldAlert } from 'lucide-react';
import styles from './Dashboard.module.css';

interface Props {
    historial: BCRAHistorialResponse | null;
    cheques: BCRAChequesResponse | null;
}

export function Dashboard({ historial, cheques }: Props) {
    if (!historial || !historial.results) return null;

    const { denominacion, identificacion, periodos } = historial.results;

    if (!periodos || periodos.length === 0) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.card} style={{ textAlign: 'center', padding: '3rem' }}>
                    <h3>Sin Historial Crediticio Reciente</h3>
                    <p className={styles.subtitle}>No se encontraron deudas reportadas en los periodos recientes para este CUIT/CUIL.</p>
                </div>
            </div>
        );
    }

    // Aggregate data for the summary cards
    const currentPeriod = periodos[0];
    const totalDebt = currentPeriod?.entidades.reduce((acc, curr) => acc + curr.monto, 0) || 0;

    // Formatear periodo YYYYMM
    let periodoStr = currentPeriod.periodo;
    if (periodoStr.length === 6) {
        periodoStr = `${periodoStr.substring(4, 6)}/${periodoStr.substring(0, 4)}`;
    }

    // Check if any entity has flags
    const hasJudicialProcess = periodos.some(p => p.entidades.some(e => e.procesoJud));
    const hasRevision = periodos.some(p => p.entidades.some(e => e.enRevision));

    // Check info
    const totalCheques = cheques?.results?.causales?.reduce((acc: number, c: any) => acc + c.entidades.reduce((eAcc: number, e: any) => eAcc + e.detalle.length, 0), 0) || 0;

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>{denominacion}</h2>
                    <p className={styles.subtitle}>CUIT/CUIL: {identificacion}</p>

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
                                <FileWarning size={14} /> Cheques Rechazados ({totalCheques})
                            </span>
                        )}
                    </div>
                </div>

                <div className={styles.headerRight}>
                    <p className={styles.headerRightSubtitle}>Deuda Total ({periodoStr})</p>
                    <p className={styles.amount}>
                        ${totalDebt.toLocaleString('es-AR')}M
                    </p>
                </div>
            </header>

            <div className={styles.grid}>
                <div className={`${styles.card} ${styles.chartCard}`}>
                    <h3>Evolución de Deuda (Últimos Meses)</h3>
                    <div className={styles.chartWrapper}>
                        <DebtChart data={periodos} />
                    </div>
                </div>

                <div className={`${styles.card} ${styles.chartCard}`}>
                    <h3>Variación Mensual (Inflows/Outflows)</h3>
                    <div className={styles.chartWrapper}>
                        <InflowChart data={periodos} />
                    </div>
                </div>

                <div className={`${styles.card} ${styles.entitiesCard}`}>
                    <h3>Situación Actual por Entidad</h3>
                    <div className={styles.entityGrid}>
                        {currentPeriod.entidades.map((entidad, idx) => (
                            <div key={idx} className={styles.entityRow}>
                                <div className={styles.entityInfo}>
                                    <span className={styles.entityName}>{entidad.entidad}</span>
                                    <span className={styles.entityAmount}>${entidad.monto.toLocaleString('es-AR')}M</span>
                                </div>
                                <StatusIndicator situacion={entidad.situacion} />
                            </div>
                        ))}
                        {currentPeriod.entidades.length === 0 && (
                            <p className={styles.subtitle} style={{ marginTop: '0.5rem' }}>Sin deudas en el último periodo reportado.</p>
                        )}
                    </div>
                </div>
            </div>

            <InfoSection />
        </div>
    );
}

