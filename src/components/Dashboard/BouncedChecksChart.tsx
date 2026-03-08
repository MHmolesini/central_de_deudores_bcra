import ReactECharts from 'echarts-for-react';
import type { BCRAChequesResponse } from '../../services/bcra';

interface Props {
    data: BCRAChequesResponse | null;
    currency: 'ARS' | 'USD' | 'ARS_REAL';
    exchangeRates: Record<string, number>;
    inflationIndex: Record<string, number>;
}

export function BouncedChecksChart({ data, currency, exchangeRates, inflationIndex }: Props) {
    if (!data || !data.results || !data.results.causales || data.results.causales.length === 0) {
        return null;
    }

    // Array to collect all checks
    const checks: { fechaRechazo: string; monto: number }[] = [];

    data.results.causales.forEach(causal => {
        causal.entidades.forEach(ent => {
            ent.detalle.forEach(det => {
                checks.push({
                    fechaRechazo: det.fechaRechazo,
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

    // Aggregate by date (YYYY-MM-DD or YYYY-MM depending on granularity desired, let's group exactly by fechaRechazo for exact dates)
    const aggregatedData: Record<string, number> = {};

    checks.forEach(check => {
        const adjustedAmount = getAdjustedAmount(check.monto, check.fechaRechazo);
        if (!aggregatedData[check.fechaRechazo]) {
            aggregatedData[check.fechaRechazo] = 0;
        }
        aggregatedData[check.fechaRechazo] += adjustedAmount;
    });

    // Sort by date chronological
    const sortedDates = Object.keys(aggregatedData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const chartData = sortedDates.map(date => aggregatedData[date]);

    const option = {
        title: {
            text: 'Monto de Cheques Rechazados por Fecha',
            textStyle: {
                color: '#fff',
                fontSize: 14,
                fontWeight: 500
            },
            left: 0,
            top: 0
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(24, 24, 27, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#fff' },
            formatter: function (params: any) {
                const date = params[0].name;
                const value = params[0].value;
                const prefix = currency === 'USD' ? 'USD ' : '$ ';

                return `
                    <div style="font-weight:600;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:4px;">
                        ${date}
                    </div>
                    Rechazado: <span style="color:#ff4d4f;font-weight:600;">${prefix}${value.toLocaleString('es-AR', {
                    maximumFractionDigits: currency === 'USD' ? 2 : 0
                })}</span>
                `;
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
                    // Extract DD/MM/YYYY for nicer display
                    const parts = val.split('-');
                    if (parts.length === 3) {
                        return `${parts[2]}/${parts[1]}/${parts[0]}`;
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
                name: 'Monto Rechazado',
                type: 'bar',
                data: chartData,
                itemStyle: {
                    color: '#ff4d4f', // Red for rejected checks
                    borderRadius: [4, 4, 0, 0]
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
            height: '400px'
        }}>
            <ReactECharts
                option={option}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'svg' }}
            />
        </div>
    );
}
