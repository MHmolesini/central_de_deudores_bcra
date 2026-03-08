import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { BCRAChequesResponse } from '../../services/bcra';

interface Props {
    data: BCRAChequesResponse | null;
    currency: 'ARS' | 'USD' | 'ARS_REAL';
    exchangeRates: Record<string, number>;
    inflationIndex: Record<string, number>;
}

export function BouncedChecksChart({ data, currency, exchangeRates, inflationIndex }: Props) {
    const [groupBy, setGroupBy] = useState<'day' | 'month'>('day');

    if (!data || !data.results || !data.results.causales || data.results.causales.length === 0) {
        return null;
    }

    // Array to collect all checks
    const checks: { fechaRechazo: string; fechaPago: string | null; monto: number }[] = [];

    data.results.causales.forEach(causal => {
        causal.entidades.forEach(ent => {
            ent.detalle.forEach(det => {
                checks.push({
                    fechaRechazo: det.fechaRechazo,
                    fechaPago: det.fechaPago,
                    monto: det.monto
                });
            });
        });
    });

    // We only care if there are rejected checks
    if (checks.length === 0) return null;

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

    // Aggregate by date
    const aggregatedData: Record<string, { paid: number, unpaid: number }> = {};

    checks.forEach(check => {
        const adjustedAmount = getAdjustedAmount(check.monto, check.fechaRechazo);
        const isPaid = !!check.fechaPago;

        let dateKey = check.fechaRechazo;
        if (groupBy === 'month') {
            dateKey = check.fechaRechazo.substring(0, 7) + '-01'; // Defaulting to the 1st of the month for simpler sorting
        }

        if (!aggregatedData[dateKey]) {
            aggregatedData[dateKey] = { paid: 0, unpaid: 0 };
        }

        if (isPaid) {
            aggregatedData[dateKey].paid += adjustedAmount;
        } else {
            aggregatedData[dateKey].unpaid += adjustedAmount;
        }
    });

    // Sort by date chronological
    const sortedDates = Object.keys(aggregatedData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const paidData = sortedDates.map(date => aggregatedData[date].paid);
    const unpaidData = sortedDates.map(date => aggregatedData[date].unpaid);

    const option = {
        title: {
            show: false,
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(24, 24, 27, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#fff' },
            formatter: function (params: any) {
                let dateStr = params[0].name;
                if (groupBy === 'month') {
                    const parts = dateStr.split('-');
                    dateStr = `${parts[1]}/${parts[0]}`;
                } else {
                    const parts = dateStr.split('-');
                    dateStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
                }

                const prefix = currency === 'USD' ? 'USD ' : '$ ';

                let tooltipContent = `
                    <div style="font-weight:600;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:4px;">
                        ${dateStr}
                    </div>
                `;

                params.forEach((serie: any) => {
                    if (serie.value > 0) {
                        tooltipContent += `
                            <div style="display:flex;justify-content:space-between;gap:1.5rem;align-items:center;">
                                <span>${serie.marker} ${serie.seriesName}:</span>
                                <span style="font-weight:600;color:${serie.color}">
                                    ${prefix}${serie.value.toLocaleString('es-AR', {
                            maximumFractionDigits: currency === 'USD' ? 2 : 0
                        })}
                                </span>
                            </div>
                        `;
                    }
                });

                return tooltipContent;
            }
        },
        grid: {
            left: '1%',
            right: '2%',
            bottom: '3%',
            top: '20%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: sortedDates,
            axisLabel: {
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: 11,
                formatter: (val: string) => {
                    const parts = val.split('-');
                    if (groupBy === 'month') {
                        return `${parts[1]}/${parts[0].substring(2)}`;
                    } else if (parts.length === 3) {
                        return `${parts[2]}/${parts[1]}/${parts[0].substring(2)}`;
                    }
                    return val;
                }
            },
            axisLine: {
                lineStyle: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        },
        yAxis: {
            type: 'value',
            splitLine: {
                lineStyle: { color: 'rgba(255, 255, 255, 0.05)', type: 'dashed' }
            },
            axisLabel: {
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: 11,
                formatter: (value: number) => {
                    const prefix = currency === 'USD' ? 'USD ' : '$';
                    if (value >= 1e9) return `${prefix}${(value / 1e9).toFixed(1)}B`;
                    if (value >= 1e6) return `${prefix}${(value / 1e6).toFixed(1)}M`;
                    if (value >= 1e3) return `${prefix}${(value / 1e3).toFixed(1)}K`;
                    return `${prefix}${value}`;
                }
            }
        },
        series: [
            {
                name: 'Impagos',
                type: 'bar',
                stack: 'total',
                data: unpaidData,
                itemStyle: {
                    color: '#ff4d4f', // Red for unpaid checks
                },
                barMaxWidth: 40
            },
            {
                name: 'Cancelados',
                type: 'bar',
                stack: 'total',
                data: paidData,
                itemStyle: {
                    color: '#50e3c2', // Green for paid checks
                    borderRadius: [4, 4, 0, 0] // Border radius goes on top of the stack
                },
                barMaxWidth: 40
            }
        ]
    };

    return (
        <div style={{
            backgroundColor: 'var(--bg-color-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '2rem',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-color)', margin: 0 }}>
                        Monto de Cheques Rechazados por Fecha
                    </h3>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '0.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <button
                        onClick={() => setGroupBy('day')}
                        style={{
                            background: groupBy === 'day' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                            color: groupBy === 'day' ? 'var(--text-color)' : 'var(--text-secondary)',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Diario
                    </button>
                    <button
                        onClick={() => setGroupBy('month')}
                        style={{
                            background: groupBy === 'month' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                            color: groupBy === 'month' ? 'var(--text-color)' : 'var(--text-secondary)',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Mensual
                    </button>
                </div>
            </div>

            <div style={{ height: '350px' }}>
                <ReactECharts
                    option={option}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                />
            </div>
        </div>
    );
}
