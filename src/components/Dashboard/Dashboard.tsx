import { useState } from 'react';
import type { BCRAHistorialResponse, BCRAChequesResponse } from '../../services/bcra';
import { DebtChart } from './DebtChart';
import { InflowChart } from './InflowChart';
import { DebtHeatmap } from './DebtHeatmap';
import { StatusIndicator } from './StatusIndicator';
import { InfoSection } from './InfoSection';
import { AlertCircle, FileWarning, ShieldAlert, DollarSign, Coins, ArrowLeftRight } from 'lucide-react';
import styles from './Dashboard.module.css';

interface Props {
    historial: BCRAHistorialResponse | null;
    cheques: BCRAChequesResponse | null;
    exchangeRates: Record<string, number>;
    inflationIndex: Record<string, number>;
}

export function Dashboard({ historial, cheques, exchangeRates, inflationIndex }: Props) {
    const [currency, setCurrency] = useState<'ARS' | 'USD' | 'ARS_REAL'>('ARS');
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


    // Función para convertir ARS (miles) a la moneda seleccionada
    const formatValue = (montoArsMiles: number, p: string = currentPeriod.periodo) => {
        if (currency === 'ARS') return montoArsMiles;

        if (currency === 'USD') {
            const currentRate = exchangeRates[p] || exchangeRates[currentPeriod.periodo] || 1;
            return (montoArsMiles * 1000) / currentRate;
        }

        if (currency === 'ARS_REAL') {
            const latestIndex = inflationIndex[currentPeriod.periodo] || 1;
            const periodIndex = inflationIndex[p] || 1;
            // Valor Real = Nominal * (Indice_Actual / Indice_Periodo)
            return montoArsMiles * (latestIndex / periodIndex);
        }

        return montoArsMiles;
    };

    const totalDebt = currentPeriod?.entidades.reduce((acc, curr) => acc + curr.monto, 0) || 0;
    const totalDebtDisplay = formatValue(totalDebt, currentPeriod.periodo);

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
                    <div className={styles.currencyToggle}>
                        <div className={`${styles.slider} ${styles[currency.toLowerCase()]}`} />
                        <button
                            className={`${styles.toggleBtn} ${currency === 'ARS' ? styles.active : ''}`}
                            onClick={() => setCurrency('ARS')}
                        >
                            <Coins size={14} /> ARS
                        </button>
                        <button
                            className={`${styles.toggleBtn} ${currency === 'USD' ? styles.active : ''}`}
                            onClick={() => setCurrency('USD')}
                        >
                            <DollarSign size={14} /> USD
                        </button>
                        <button
                            className={`${styles.toggleBtn} ${currency === 'ARS_REAL' ? styles.active : ''}`}
                            onClick={() => setCurrency('ARS_REAL')}
                            title="Pesos Ajustados por Inflación"
                        >
                            <ArrowLeftRight size={14} /> REAL
                        </button>
                    </div>
                    <p className={styles.headerRightSubtitle}>Deuda al {periodoStr}</p>
                </div>
            </header>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>Total Deuda Consolidada</h3>
                    <div className={styles.amount}>
                        {currency === 'USD' ? 'USD ' : '$ '}
                        {totalDebtDisplay.toLocaleString('es-AR', {
                            minimumFractionDigits: currency === 'ARS' ? 0 : 2,
                            maximumFractionDigits: currency === 'ARS' ? 0 : 2
                        })}
                        {currency === 'USD' ? '' : 'M'}
                    </div>
                    <p className={styles.subtitle} style={{ marginTop: '0.5rem' }}>
                        {currency === 'ARS' ? 'Pesos nominales (en miles)' : (currency === 'USD' ? 'Dólares estadounidenses' : 'Pesos constantes (ajustados)')}
                    </p>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <h3>Evolución de Deuda (Últimos Meses)</h3>
                            <p className={styles.cardSubtitle}>Estructura de deuda por entidad financiera</p>
                        </div>
                    </div>
                    <div className={styles.chartWrapper}>
                        <DebtChart data={periodos} currency={currency} exchangeRates={exchangeRates} inflationIndex={inflationIndex} />
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <h3>Flujo de Fondos (Variación Mensual)</h3>
                            <p className={styles.cardSubtitle}>Inflow vs Outflow por periodo</p>
                        </div>
                    </div>
                    <div className={styles.chartWrapper}>
                        <InflowChart data={periodos} currency={currency} exchangeRates={exchangeRates} inflationIndex={inflationIndex} />
                    </div>
                </div>

                <DebtHeatmap data={periodos} currency={currency} exchangeRates={exchangeRates} inflationIndex={inflationIndex} />

                <div className={`${styles.card} ${styles.entitiesCard}`}>
                    <h3>Situación Actual por Entidad</h3>
                    <div className={styles.entityGrid}>
                        {currentPeriod.entidades.map((entidad, idx) => (
                            <div key={idx} className={styles.entityRow}>
                                <div className={styles.entityInfo}>
                                    <span className={styles.entityName}>{entidad.entidad}</span>
                                    <span className={styles.entityAmount}>
                                        {currency === 'USD' ? 'USD ' : '$ '}
                                        {formatValue(entidad.monto).toLocaleString('es-AR', {
                                            maximumFractionDigits: currency === 'USD' ? 2 : 0
                                        })}
                                        {currency === 'USD' ? '' : 'M'}
                                    </span>
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


