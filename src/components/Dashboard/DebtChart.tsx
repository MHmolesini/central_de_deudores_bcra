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

export function DebtChart({ data, currency = 'ARS', exchangeRates = {}, inflationIndex = {} }: Props) {
    const [viewMode, setViewMode] = useState<'amount' | 'percent'>('amount');

    const handleExport = () => {
        const exportData = data.flatMap(period => {
            const rate = exchangeRates[period.periodo] || 1;
            return period.entidades.map(entidad => ({
                'Periodo': formatPeriodLabel(period.periodo),
                'Entidad': entidad.entidad,
                'Situación': entidad.situacion,
                'Monto': currency === 'ARS' ? entidad.monto : (entidad.monto * 1000) / rate,
                'Moneda': currency === 'ARS' ? 'ARS (Miles)' : 'USD'
            }));
        });
        exportToExcel(exportData, `Evolución_Deuda_${currency}`);
    };

    // Extract periods and unique banks (entidades) to map series
    const periods = data.map((d) => d.periodo).reverse();

    const bankNames = new Set<string>();
    data.forEach((p) => p.entidades.forEach((e) => bankNames.add(e.entidad)));
    const banks = Array.from(bankNames);

    // Calculate total per period to compute percentages
    const periodTotals = [...data].reverse().map(period =>
        period.entidades.reduce((acc, curr) => acc + curr.monto, 0)
    );

    // Map data per bank
    const series = banks.map((bank, index) => {
        // Pastel colors from our CSS tokens or hardcoded map
        const chartColors = [
            '#cbb4d4', '#84fab0', '#8fd3f4', '#ffd194', '#ff9a9e',
            '#a1c4fd', '#fbc2eb', '#88d3ce', '#fbd72b', '#a18cd1',
            '#d4fc79', '#96e6a1', '#4facfe', '#f093fb', '#f6d365',
            '#667eea', '#30cfd0', '#ff758c', '#4fb576', '#0ba360',
            '#3cba92', '#df89b5', '#5f72bd', '#00c6ff'
        ];

        const dataPoints = [...data].reverse().map((period, pIdx) => {
            const match = period.entidades.find((e) => e.entidad === bank);
            const rawMonto = match ? match.monto : 0;
            const rate = exchangeRates[period.periodo] || 1;

            // Convertir monto si es necesario
            let monto = rawMonto;
            if (currency === 'USD') {
                monto = (rawMonto * 1000) / rate;
            } else if (currency === 'ARS_REAL') {
                const latestIndex = inflationIndex[data[0].periodo] || 1;
                const periodIndex = inflationIndex[period.periodo] || 1;
                monto = rawMonto * (latestIndex / periodIndex);
            }

            const totalArs = periodTotals[pIdx];
            const pct = totalArs > 0 ? (rawMonto / totalArs) * 100 : 0;

            return {
                value: viewMode === 'percent' ? pct : monto,
                monto: monto,
                pct: pct
            };
        });

        return {
            name: bank,
            type: 'bar',
            stack: 'total',
            itemStyle: {
                color: chartColors[index % chartColors.length],
                borderRadius: [4, 4, 0, 0] // Rounded tops
            },
            emphasis: { focus: 'series' },
            data: dataPoints
        };
    });

    // Calculate formatted labels. Using Real API format "YYYYMM"
    const formattedPeriods = periods.map(p => {
        if (p.length === 6) {
            const yr = p.substring(0, 4);
            const ms = p.substring(4, 6);
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const mIdx = parseInt(ms, 10) - 1;
            return `${monthNames[mIdx] || ms} ${yr}`;
        }
        // Fallback for mocked format if needed
        if (p.length === 4) {
            const ms = p.substring(0, 2);
            const yr = p.substring(2, 4);
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const mIdx = parseInt(ms, 10) - 1;
            return `${monthNames[mIdx] || ms} ${yr}`;
        }
        return p;
    });



    const options = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(24, 24, 27, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#fff' },
            formatter: (params: any) => {
                let text = `<strong>${params[0].name}</strong><br/>`;
                let totalMonto = 0;
                let prevTotalMonto = 0;

                const currentIndex = params[0].dataIndex;
                const prevIndex = currentIndex - 1;

                params.forEach((p: any) => {
                    const currentMonto = p.data.monto;
                    const currentPct = p.data.pct;

                    if (currentMonto > 0) {
                        let prevMonto = 0;
                        if (prevIndex >= 0) {
                            const seriesData = series.find(s => s.name === p.seriesName);
                            if (seriesData && seriesData.data[prevIndex]) {
                                prevMonto = seriesData.data[prevIndex].monto;
                            }
                        }

                        let variationStr = '';
                        if (prevMonto > 0) {
                            const diff = currentMonto - prevMonto;
                            if (diff !== 0) {
                                const pctChange = ((diff / prevMonto) * 100).toFixed(1);
                                const color = diff > 0 ? '#ff4d4f' : '#50e3c2';
                                const sign = diff > 0 ? '+' : '';
                                variationStr = `<span style="color: ${color}; font-size: 0.85em; margin-left: 6px;">(${sign}${pctChange}%)</span>`;
                            }
                        } else if (prevIndex >= 0 && prevMonto === 0) {
                            variationStr = `<span style="color: #ff4d4f; font-size: 0.85em; margin-left: 6px;">(Nueva)</span>`;
                        }

                        // Display both the absolute amount and the percentage of the whole
                        const pctStr = currentPct > 0 ? ` <span style="color: #888">(${currentPct.toFixed(1)}%)</span>` : '';

                        text += `${p.marker} <span style="font-size: 0.8em">${p.seriesName}</span>: ${currency === 'USD' ? 'USD ' : '$ '}${currentMonto.toLocaleString('es-AR', {
                            minimumFractionDigits: currency === 'ARS' ? 0 : 2,
                            maximumFractionDigits: currency === 'ARS' ? 0 : 2
                        })}${currency === 'USD' ? '' : 'M'}${pctStr} ${variationStr}<br/>`;
                        totalMonto += currentMonto;
                    }
                });

                if (prevIndex >= 0) {
                    series.forEach(s => {
                        if (s.data[prevIndex]) {
                            prevTotalMonto += s.data[prevIndex].monto;
                        }
                    });
                }

                let totalVarStr = '';
                if (prevTotalMonto > 0) {
                    const diffTotal = totalMonto - prevTotalMonto;
                    if (diffTotal !== 0) {
                        const pctTotal = ((diffTotal / prevTotalMonto) * 100).toFixed(1);
                        const colorTotal = diffTotal > 0 ? '#ff4d4f' : '#50e3c2';
                        const signTotal = diffTotal > 0 ? '+' : '';
                        totalVarStr = `<span style="color: ${colorTotal}; font-size: 0.85em; margin-left: 6px;">(${signTotal}${pctTotal}%)</span>`;
                    }
                }

                text += `<hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:4px 0" /><strong>Total Mes: ${currency === 'USD' ? 'USD ' : '$ '}${totalMonto.toLocaleString('es-AR', {
                    minimumFractionDigits: currency === 'ARS' ? 0 : 2,
                    maximumFractionDigits: currency === 'ARS' ? 0 : 2
                })}${currency === 'USD' ? '' : 'M'} ${totalVarStr}</strong>`;
                return text;
            }
        },
        legend: {
            type: 'scroll',
            data: banks,
            textStyle: { color: '#a1a1aa' },
            bottom: 0,
            icon: 'circle',
            pageIconColor: '#fff',
            pageTextStyle: { color: '#888' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: 60,
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
            max: viewMode === 'percent' ? 100 : undefined,
            axisLabel: {
                color: '#a1a1aa',
                formatter: (value: number) => {
                    if (viewMode === 'percent') return `${value}%`;
                    const symbol = currency === 'USD' ? 'USD ' : '$ ';
                    const suffix = currency === 'USD' ? '' : 'M';
                    return `${symbol}${value.toLocaleString('es-AR', {
                        maximumFractionDigits: 0 // Keep it clean for axis
                    })}${suffix}`;
                }
            },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }
        },
        series: series
    };

    const chartHeight = 450;

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
                        onClick={() => setViewMode('amount')}
                        style={{
                            background: viewMode === 'amount' ? 'rgba(255,255,255,0.1)' : 'transparent',
                            border: 'none',
                            color: viewMode === 'amount' ? '#fff' : '#a1a1aa',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            transition: 'all 0.2s',
                            fontWeight: viewMode === 'amount' ? '600' : 'normal'
                        }}
                    >
                        Monto
                    </button>
                    <button
                        onClick={() => setViewMode('percent')}
                        style={{
                            background: viewMode === 'percent' ? 'rgba(255,255,255,0.1)' : 'transparent',
                            border: 'none',
                            color: viewMode === 'percent' ? '#fff' : '#a1a1aa',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            transition: 'all 0.2s',
                            fontWeight: viewMode === 'percent' ? '600' : 'normal'
                        }}
                    >
                        % Peso
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
