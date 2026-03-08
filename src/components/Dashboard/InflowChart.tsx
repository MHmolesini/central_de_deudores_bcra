import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Download } from 'lucide-react';
import type { BCRAPeriodo } from '../../services/bcra';
import { exportToExcel, formatPeriodLabel } from '../../utils/exportUtils';

interface Props {
    data: BCRAPeriodo[];
    currency?: 'ARS' | 'USD' | 'ARS_REAL';
    exchangeRates?: Record<string, number>;
    inflationIndex?: Record<string, number>;
}

export function InflowChart({ data, currency = 'ARS', exchangeRates = {}, inflationIndex = {} }: Props) {
    const [viewMode, setViewMode] = useState<'mensual' | 'acumulada'>('mensual');

    const handleExport = () => {
        const banksList = Array.from(new Set(data.flatMap(p => p.entidades.map(e => e.entidad))));
        const reversedData = [...data].reverse();

        const exportData = reversedData.flatMap((period, pIdx) => {
            return banksList.map(bank => {
                const match = period.entidades.find(e => e.entidad === bank);
                const rawMonto = match ? match.monto : 0;
                let currentVal = rawMonto;
                if (currency === 'USD') {
                    const rate = exchangeRates[period.periodo] || exchangeRates[data[0].periodo] || 1;
                    currentVal = (rawMonto * 1000) / rate;
                } else if (currency === 'ARS_REAL') {
                    const latestIndex = inflationIndex[data[0].periodo] || 1;
                    const periodIndex = inflationIndex[period.periodo] || 1;
                    currentVal = rawMonto * (latestIndex / periodIndex);
                }

                let prevVal = 0;
                if (pIdx > 0) {
                    const prevPeriod = reversedData[pIdx - 1];
                    const prevMatch = prevPeriod.entidades.find(e => e.entidad === bank);
                    const prevRawMonto = prevMatch ? prevMatch.monto : 0;

                    prevVal = prevRawMonto;
                    if (currency === 'USD') {
                        const prevRate = exchangeRates[prevPeriod.periodo] || exchangeRates[data[0].periodo] || 1;
                        prevVal = (prevRawMonto * 1000) / prevRate;
                    } else if (currency === 'ARS_REAL') {
                        const latestIndex = inflationIndex[data[0].periodo] || 1;
                        const prevPeriodIndex = inflationIndex[prevPeriod.periodo] || 1;
                        prevVal = prevRawMonto * (latestIndex / prevPeriodIndex);
                    }
                }

                const variation = pIdx > 0 ? currentVal - prevVal : 0;

                return {
                    'Periodo': formatPeriodLabel(period.periodo),
                    'Entidad': bank,
                    'Variación': variation,
                    'Moneda': currency === 'ARS' ? 'ARS (Miles)' : (currency === 'USD' ? 'USD' : 'Pesos Reales')
                };
            }).filter(row => row.Variación !== 0 || pIdx === 0);
        });

        exportToExcel(exportData, `Flujo_Fondos_${currency}`);
    };

    // Extract periods and unique banks (entidades) to map series
    const periods = data.map((d) => d.periodo).reverse();

    const bankNames = new Set<string>();
    data.forEach((p) => p.entidades.forEach((e) => bankNames.add(e.entidad)));
    const banks = Array.from(bankNames);

    const series = banks.map((bank, index) => {
        const pastelColors = [
            '#cbb4d4', '#84fab0', '#8fd3f4', '#ffd194', '#ff9a9e'
        ];

        // Map through the reversed data (oldest to newest)
        const reversedData = [...data].reverse();

        let accumulated = 0;
        const dataPoints = reversedData.map((period, pIdx) => {
            const match = period.entidades.find((e) => e.entidad === bank);
            const rawMonto = match ? match.monto : 0;

            let currentVal = rawMonto;
            if (currency === 'USD') {
                const rate = exchangeRates[period.periodo] || exchangeRates[data[0].periodo] || 1;
                currentVal = (rawMonto * 1000) / rate;
            } else if (currency === 'ARS_REAL') {
                const latestIndex = inflationIndex[data[0].periodo] || 1;
                const periodIndex = inflationIndex[period.periodo] || 1;
                currentVal = rawMonto * (latestIndex / periodIndex);
            }

            let prevVal = 0;
            if (pIdx > 0) {
                const prevPeriod = reversedData[pIdx - 1];
                const prevMatch = prevPeriod.entidades.find((e) => e.entidad === bank);
                const prevRawMonto = prevMatch ? prevMatch.monto : 0;
                prevVal = prevRawMonto;
                if (currency === 'USD') {
                    const prevRate = exchangeRates[prevPeriod.periodo] || exchangeRates[data[0].periodo] || 1;
                    prevVal = (prevRawMonto * 1000) / prevRate;
                } else if (currency === 'ARS_REAL') {
                    const latestIndex = inflationIndex[data[0].periodo] || 1;
                    const prevPeriodIndex = inflationIndex[prevPeriod.periodo] || 1;
                    prevVal = prevRawMonto * (latestIndex / prevPeriodIndex);
                }
            }

            const diff = pIdx > 0 ? currentVal - prevVal : 0;
            accumulated = pIdx === 0 ? currentVal : accumulated + diff;

            return viewMode === 'acumulada' ? accumulated : diff;
        });

        return {
            name: bank,
            type: 'bar',
            stack: 'total',
            itemStyle: {
                color: pastelColors[index % pastelColors.length],
            },
            emphasis: { focus: 'series' },
            data: dataPoints
        };
    });

    const formattedPeriods = periods.map(p => {
        if (p.length === 6) {
            const yr = p.substring(0, 4);
            const ms = p.substring(4, 6);
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const mIdx = parseInt(ms, 10) - 1;
            return `${monthNames[mIdx] || ms} ${yr}`;
        }
        if (p.length === 4) {
            const ms = p.substring(0, 2);
            const yr = p.substring(2, 4);
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const mIdx = parseInt(ms, 10) - 1;
            return `${monthNames[mIdx] || ms} ${yr}`;
        }
        return p;
    });

    const legendRows = Math.ceil(banks.length / 2);
    const dynamicBottom = `${Math.max(15, 10 + (legendRows * 4))}%`;

    const options = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(24, 24, 27, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#fff' },
            formatter: (params: any) => {
                let text = `<strong>${params[0].name} (${viewMode === 'acumulada' ? 'Variación Acumulada' : 'Variación Mensual'})</strong><br/>`;
                let netChange = 0;

                params.forEach((p: any) => {
                    if (p.value !== 0) {
                        const color = p.value > 0 ? '#ff4d4f' : '#50e3c2'; // Red for debt increase, Green for debt decrease
                        const sign = p.value > 0 ? '+' : '';
                        const symbol = currency === 'USD' ? 'USD ' : '$ ';
                        const suffix = currency === 'USD' ? '' : 'M';
                        text += `${p.marker} <span style="font-size: 0.8em">${p.seriesName}</span>: <span style="color:${color}">${symbol}${sign}${p.value.toLocaleString('es-AR', {
                            minimumFractionDigits: currency === 'USD' ? 2 : 0,
                            maximumFractionDigits: currency === 'USD' ? 2 : 0
                        })}${suffix}</span><br/>`;
                        netChange += p.value;
                    }
                });

                if (netChange !== 0) {
                    const totalColor = netChange > 0 ? '#ff4d4f' : '#50e3c2';
                    const totalSign = netChange > 0 ? '+' : '';
                    const symbol = currency === 'USD' ? 'USD ' : '$ ';
                    const suffix = currency === 'USD' ? '' : 'M';
                    text += `<hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:4px 0" /><strong>${viewMode === 'acumulada' ? 'Total Acumulado' : 'Total Variación'}: <span style="color:${totalColor}">${symbol}${totalSign}${netChange.toLocaleString('es-AR', {
                        minimumFractionDigits: currency === 'USD' ? 2 : 0,
                        maximumFractionDigits: currency === 'USD' ? 2 : 0
                    })}${suffix}</span></strong>`;
                }

                return text;
            }
        },
        legend: {
            data: banks,
            textStyle: { color: '#a1a1aa' },
            bottom: 0,
            icon: 'circle'
        },
        grid: {
            left: '4%',
            right: '4%',
            bottom: dynamicBottom,
            top: '5%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: formattedPeriods,
            axisLabel: { color: '#a1a1aa' },
            axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: '#a1a1aa',
                formatter: (value: number) => {
                    const symbol = currency === 'USD' ? 'USD ' : '$ ';
                    const suffix = currency === 'USD' ? '' : 'M';
                    return `${symbol}${value.toLocaleString('es-AR', {
                        maximumFractionDigits: 0
                    })}${suffix}`;
                }
            },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }
        },
        series: series
    };

    const chartHeight = Math.max(400, 320 + (legendRows * 20));

    return (
        <div style={{ width: '100%' }}>
            {/* Toggle Container - Absolute positioned Top Right */}
            <div style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                zIndex: 10
            }}>
                <button
                    onClick={handleExport}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        color: '#a1a1aa',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        transition: 'all 0.2s'
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
                    <Download size={14} />
                    XLSX
                </button>

                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px', display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => setViewMode('mensual')}
                        style={{
                            background: viewMode === 'mensual' ? 'rgba(255,255,255,0.1)' : 'transparent',
                            border: 'none',
                            color: viewMode === 'mensual' ? '#fff' : '#a1a1aa',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            transition: 'all 0.2s',
                            fontWeight: viewMode === 'mensual' ? '600' : 'normal'
                        }}
                    >
                        Mensual
                    </button>
                    <button
                        onClick={() => setViewMode('acumulada')}
                        style={{
                            background: viewMode === 'acumulada' ? 'rgba(255,255,255,0.1)' : 'transparent',
                            border: 'none',
                            color: viewMode === 'acumulada' ? '#fff' : '#a1a1aa',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            transition: 'all 0.2s',
                            fontWeight: viewMode === 'acumulada' ? '600' : 'normal'
                        }}
                    >
                        Acumulada
                    </button>
                </div>
            </div>

            {/* Chart Container */}
            <div style={{ height: `${chartHeight}px`, width: '100%' }}>
                <ReactECharts
                    option={options}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'canvas' }}
                />
            </div>
        </div>
    );
}
