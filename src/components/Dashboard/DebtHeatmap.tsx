import { useMemo, useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { LayoutGrid, Filter, ChevronDown, Download } from 'lucide-react';
import type { BCRAPeriodo } from '../../services/bcra';
import { exportToExcel } from '../../utils/exportUtils';
import styles from './Dashboard.module.css';

interface Props {
    data: BCRAPeriodo[];
    currency?: 'ARS' | 'USD' | 'ARS_REAL';
    exchangeRates?: Record<string, number>;
    inflationIndex?: Record<string, number>;
}

export function DebtHeatmap({ data, currency = 'ARS', exchangeRates = {}, inflationIndex = {} }: Props) {
    const [selectedBank, setSelectedBank] = useState<string>('all');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleExport = () => {
        const monthNamesFull = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const yearList = heatmapData.yearList;

        const exportData = heatmapData.entries.map(entry => {
            const monthIdx = entry[0];
            const yearIdx = entry[1];
            const variation = entry[2];
            const year = yearList[yearIdx];

            return {
                'Año': year,
                'Mes': monthNamesFull[monthIdx],
                'Entidad': selectedBank === 'all' ? 'Total' : selectedBank,
                'Variación': variation,
                'Moneda': currency === 'ARS' ? 'ARS (Miles)' : (currency === 'USD' ? 'USD' : 'Pesos Reales')
            };
        });

        exportToExcel(exportData, `Heatmap_Deuda_${selectedBank}_${currency}`);
    };

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Extract unique banks
    const bankNames = useMemo(() => {
        const names = new Set<string>();
        data.forEach((p) => p.entidades.forEach((e) => names.add(e.entidad)));
        return Array.from(names).sort();
    }, [data]);

    // Process data for the heatmap
    const heatmapData = useMemo(() => {
        const sortedData = [...data].sort((a, b) => a.periodo.localeCompare(b.periodo));
        const years = new Set<string>();
        const entries: [number, number, number][] = [];

        // Pre-convert relevant totals to compute variations
        const monthlyTotals = sortedData.map(p => {
            const totalArs = p.entidades
                .filter(e => selectedBank === 'all' || e.entidad === selectedBank)
                .reduce((acc, curr) => acc + curr.monto, 0);

            if (currency === 'USD') {
                const rate = exchangeRates[p.periodo] || exchangeRates[data[0].periodo] || 1;
                return (totalArs * 1000) / rate;
            } else if (currency === 'ARS_REAL') {
                const latestIndex = inflationIndex[data[0].periodo] || 1;
                const periodIndex = inflationIndex[p.periodo] || 1;
                return totalArs * (latestIndex / periodIndex);
            }
            return totalArs;
        });

        sortedData.forEach(p => years.add(p.periodo.substring(0, 4)));
        const yearList = Array.from(years).sort();

        sortedData.forEach((period, pIdx) => {
            const year = period.periodo.substring(0, 4);
            const month = period.periodo.substring(4, 6);
            const yearIdx = yearList.indexOf(year);
            const monthIdx = parseInt(month, 10) - 1;

            if (yearIdx === -1) return;

            const currentTotal = monthlyTotals[pIdx];
            const prevTotal = pIdx > 0 ? monthlyTotals[pIdx - 1] : currentTotal;
            const variation = pIdx === 0 ? 0 : currentTotal - prevTotal;

            // ECharts heatmap expects [x, y, value]
            entries.push([monthIdx, yearIdx, Number(variation.toFixed(2))]);
        });

        return { entries, yearList };
    }, [data, selectedBank, currency, exchangeRates, inflationIndex]);

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const options = {
        tooltip: {
            position: 'top',
            backgroundColor: 'rgba(24, 24, 27, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#fff' },
            formatter: (params: any) => {
                const val = params.data[2];
                const year = heatmapData.yearList[params.data[1]];
                const month = monthNames[params.data[0]];
                const color = val > 0 ? '#ff4d4f' : (val < 0 ? '#50e3c2' : '#888');
                const symbol = currency === 'USD' ? 'USD ' : '$ ';
                const suffix = currency === 'USD' ? '' : 'M';
                const sign = val > 0 ? '+' : '';

                return `<strong>${month} ${year}</strong><br/>` +
                    `Variación: <span style="color:${color}">${symbol}${sign}${val.toLocaleString('es-AR')}${suffix}</span>`;
            }
        },
        grid: {
            top: '10%',
            bottom: '15%',
            left: '10%',
            right: '5%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: monthNames,
            splitArea: { show: true },
            axisLabel: { color: '#a1a1aa' },
            axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
        },
        yAxis: {
            type: 'category',
            data: heatmapData.yearList,
            splitArea: { show: true },
            axisLabel: { color: '#a1a1aa' },
            axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
        },
        visualMap: {
            min: -10,
            max: 10,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '0%',
            inRange: {
                color: ['#50e3c2', '#1a1a1a', '#ff4d4f']
            },
            textStyle: { color: '#a1a1aa' },
            formatter: (val: number) => val === 0 ? '0' : (val > 0 ? `+${val}` : val)
        },
        series: [{
            name: 'Variación de Deuda',
            type: 'heatmap',
            data: heatmapData.entries,
            label: {
                show: false
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
    };

    const values = heatmapData.entries.map(e => e[2]);
    if (values.length > 0) {
        const maxAbs = Math.max(...values.map(Math.abs));
        (options.visualMap as any).min = -maxAbs || -1;
        (options.visualMap as any).max = maxAbs || 1;
    }

    return (
        <div className={styles.card} style={{ marginTop: '2rem' }}>
            <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className={styles.iconContainer}>
                        <LayoutGrid size={20} className={styles.primaryIcon} />
                    </div>
                    <div>
                        <h3 className={styles.cardTitle}>Mapa de Calor de Deuda</h3>
                        <p className={styles.cardSubtitle}>Variaciones mensuales por año</p>
                    </div>
                </div>

                <div className={styles.filterContainer} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        onClick={handleExport}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            color: '#a1a1aa',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.85rem',
                            transition: 'all 0.2s',
                            height: '38px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#fff';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#a1a1aa';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}
                    >
                        <Download size={16} />
                        XLSX
                    </button>

                    <div ref={menuRef}>
                        <div className={styles.customSelect}>
                            <button
                                className={styles.selectTrigger}
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                style={{ height: '38px' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Filter size={16} style={{ color: '#a1a1aa' }} />
                                    <span>{selectedBank === 'all' ? 'Todos los Bancos' : selectedBank}</span>
                                </div>
                                <ChevronDown
                                    size={16}
                                    style={{
                                        transition: 'transform 0.2s ease',
                                        transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0)'
                                    }}
                                />
                            </button>

                            {isMenuOpen && (
                                <div className={styles.selectMenu}>
                                    <div
                                        className={`${styles.selectOption} ${selectedBank === 'all' ? styles.active : ''}`}
                                        onClick={() => {
                                            setSelectedBank('all');
                                            setIsMenuOpen(false);
                                        }}
                                    >
                                        Todos los Bancos
                                    </div>
                                    {bankNames.map(name => (
                                        <div
                                            key={name}
                                            className={`${styles.selectOption} ${selectedBank === name ? styles.active : ''}`}
                                            onClick={() => {
                                                setSelectedBank(name);
                                                setIsMenuOpen(false);
                                            }}
                                        >
                                            {name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ height: '350px', width: '100%' }}>
                <ReactECharts
                    option={options}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'canvas' }}
                />
            </div>
        </div>
    );
}
