import { useState, useEffect } from 'react';
import type { BCRAHistorialResponse, BCRAChequesResponse } from '../../services/bcra';
import { DebtChart } from './DebtChart';
import { InflowChart } from './InflowChart';
import { DebtHeatmap } from './DebtHeatmap';
import { EntityPieChart } from './EntityPieChart';
import { BankLogo } from './BankLogo';
import { StatusIndicator } from './StatusIndicator';
import { InfoSection } from './InfoSection';
import { AlertCircle, FileWarning, ShieldAlert, DollarSign, Coins, ArrowLeftRight } from 'lucide-react';
import { SearchForm } from '../Search/SearchForm';
import styles from './Dashboard.module.css';

interface Props {
    historial: BCRAHistorialResponse | null;
    cheques: BCRAChequesResponse | null;
    exchangeRates: Record<string, number>;
    inflationIndex: Record<string, number>;
    onSearch: (cuit: string) => void;
    isLoading: boolean;
}

export function Dashboard({ historial, cheques, exchangeRates, inflationIndex, onSearch, isLoading }: Props) {
    const [currency, setCurrency] = useState<'ARS' | 'USD' | 'ARS_REAL'>('ARS');
    const [scrolledRatio, setScrolledRatio] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            // Max opacity reached at 150px scroll
            const ratio = Math.min(scrollY / 150, 1);
            setScrolledRatio(ratio);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    const getBorderColor = (sit?: number) => {
        switch (sit) {
            case 1: return 'rgba(80, 227, 194, 0.35)';  // green
            case 2: return 'rgba(245, 166, 35, 0.35)';  // yellow
            case 3: return 'rgba(245, 120, 35, 0.35)';  // orange
            case 4: return 'rgba(255, 0, 0, 0.35)';     // red
            case 5: case 6: return 'rgba(139, 0, 0, 0.35)'; // darkred
            default: return 'rgba(161, 161, 170, 0.25)'; // gray
        }
    };

    return (
        <>
            <header
                className={styles.header}
                style={{
                    background: `linear-gradient(to bottom, rgba(3, 7, 18, ${scrolledRatio * 0.98}) 20%, rgba(3, 7, 18, ${scrolledRatio * 0.05}) 100%)`,
                    backdropFilter: `blur(${scrolledRatio * 20}px)`,
                    WebkitBackdropFilter: `blur(${scrolledRatio * 20}px)`,
                }}
            >
                <div className={styles.headerContainer}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                        <SearchForm compact onSearch={onSearch} isLoading={isLoading} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1.5rem' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 className={styles.title}>{denominacion}</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                                    <p className={styles.subtitle}>CUIT/CUIL: {identificacion}</p>
                                    {/* Chips for warning flags */}
                                    <div className={styles.flags} style={{ marginTop: 0 }}>
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
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                                <div className={styles.amount} style={{ fontSize: '2.5rem' }}>
                                    {currency === 'USD' ? 'USD ' : '$ '}
                                    {totalDebtDisplay.toLocaleString('es-AR', {
                                        minimumFractionDigits: currency === 'ARS' ? 0 : 2,
                                        maximumFractionDigits: currency === 'ARS' ? 0 : 2
                                    })}
                                    {currency === 'USD' ? '' : 'M'}
                                </div>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 500 }}>
                                    Deuda al {periodoStr}
                                </span>
                            </div>
                            <p className={styles.subtitle} style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                {currency === 'ARS' ? 'Pesos nominales (en miles)' : (currency === 'USD' ? 'Dólares estadounidenses' : 'Pesos constantes (ajustados)')}
                            </p>
                        </div>

                    </div>
                </div>
            </header>

            <div className={styles.dashboard}>
                <div className={styles.grid}>
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

                    <div className={styles.splitRow}>
                        <div style={{ flex: 2, minWidth: 0 }}>
                            <DebtHeatmap data={periodos} currency={currency} exchangeRates={exchangeRates} inflationIndex={inflationIndex} />
                        </div>
                        <div className={styles.card} style={{ flex: 1, minWidth: 0 }}>
                            <div className={styles.cardHeader} style={{ marginBottom: '1rem' }}>
                                <div>
                                    <h3>Composición de Deuda</h3>
                                    <p className={styles.cardSubtitle}>Último mes reportado ({periodoStr})</p>
                                </div>
                            </div>
                            <EntityPieChart data={periodos} currency={currency} exchangeRates={exchangeRates} inflationIndex={inflationIndex} />
                        </div>
                    </div>

                    <div className={`${styles.card} ${styles.entitiesCard}`}>
                        <h3>Situación Actual por Entidad</h3>
                        <div className={styles.entityGrid}>
                            {currentPeriod.entidades.map((entidad, idx) => (
                                <div
                                    key={idx}
                                    className={styles.entityRow}
                                    style={{ borderColor: getBorderColor(entidad.situacion) }}
                                >
                                    <div className={styles.entityRowTop}>
                                        <BankLogo bankName={entidad.entidad} size={36} />
                                        <span className={styles.entityName} title={entidad.entidad}>{entidad.entidad}</span>
                                    </div>
                                    <div className={styles.entityRowBottom}>
                                        <span className={styles.entityAmount}>
                                            {currency === 'USD' ? 'USD ' : '$ '}
                                            {formatValue(entidad.monto).toLocaleString('es-AR', {
                                                maximumFractionDigits: currency === 'USD' ? 2 : 0
                                            })}
                                            {currency === 'USD' ? '' : 'M'}
                                        </span>
                                        <StatusIndicator situacion={entidad.situacion} />
                                    </div>
                                </div>
                            ))}
                            {currentPeriod.entidades.length === 0 && (
                                <p className={styles.subtitle} style={{ marginTop: '0.5rem' }}>Sin deudas en el último periodo reportado.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <InfoSection />
        </>
    );
}


