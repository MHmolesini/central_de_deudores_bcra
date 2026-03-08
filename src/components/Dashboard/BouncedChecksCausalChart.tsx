import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { BCRAChequesResponse } from '../../services/bcra';

interface Props {
    data: BCRAChequesResponse | null;
    currency: 'ARS' | 'USD' | 'ARS_REAL';
    exchangeRates: Record<string, number>;
    inflationIndex: Record<string, number>;
}

export function BouncedChecksCausalChart({ data, currency, exchangeRates, inflationIndex }: Props) {
    const chartData = useMemo(() => {
        if (!data || !data.results || !data.results.causales) return [];

        return data.results.causales.map(causal => {
            let totalAmount = 0;
            causal.entidades.forEach(ent => {
                ent.detalle.forEach(det => {
                    const amount = det.monto;
                    const dateStr = det.fechaRechazo;
                    const periodKey = dateStr.substring(0, 7);

                    let adjusted = amount;
                    if (currency === 'USD') {
                        const rate = exchangeRates[periodKey] || exchangeRates[Object.keys(exchangeRates).sort().pop() || ''];
                        adjusted = rate ? amount / rate : amount;
                    } else if (currency === 'ARS_REAL') {
                        const currentPeriodKey = Object.keys(inflationIndex).sort().pop();
                        const currentIndex = currentPeriodKey ? inflationIndex[currentPeriodKey] : null;
                        const historicalIndex = inflationIndex[periodKey];
                        if (currentIndex && historicalIndex) {
                            adjusted = amount * (currentIndex / historicalIndex);
                        }
                    }
                    totalAmount += adjusted;
                });
            });

            return {
                name: causal.causal.toUpperCase(),
                value: totalAmount
            };
        }).filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [data, currency, exchangeRates, inflationIndex]);

    if (chartData.length === 0) return null;

    const getCausalColor = (name: string) => {
        const c = name.toUpperCase();
        if (c.includes('SIN FONDOS')) return '#ef4444';
        if (c.includes('DEFECTOS FORMALES')) return '#f59e0b';
        if (c.includes('ORDEN DE NO PAGAR')) return '#3b82f6';
        if (c.includes('EXCESO DE ENDOSOS')) return '#a855f7';
        if (c.includes('FUERA DE TÉRMINO')) return '#a1a1aa';
        if (c.includes('TRANSACCIÓN DUPLICADA')) return '#06b6d4';
        if (c.includes('CUENTA CERRADA')) return '#ec4899';
        return '#8b5cf6';
    };

    const formatValue = (value: number) => {
        const formatter = new Intl.NumberFormat('es-AR', {
            maximumFractionDigits: currency === 'USD' ? 2 : 0
        });
        const prefix = currency === 'USD' ? 'USD ' : '$ ';
        const suffix = currency === 'USD' ? '' : 'M';
        return `${prefix}${formatter.format(value)}${suffix}`;
    };

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(24, 24, 27, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#fff' },
            formatter: (params: any) => {
                return `<div style="padding: 4px;">
                    <div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
                    <div style="display: flex; justify-content: space-between; gap: 20px;">
                        <span>Monto:</span>
                        <span style="font-weight: 600;">${formatValue(params.value)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 20px; font-size: 0.85em; color: #a1a1aa;">
                        <span>Porcentaje:</span>
                        <span>${params.percent}%</span>
                    </div>
                </div>`;
            }
        },
        legend: {
            type: 'scroll',
            orient: 'vertical',
            right: 0,
            top: 'middle',
            textStyle: { color: '#888', fontSize: 12 },
            pageIconColor: '#fff',
            pageTextStyle: { color: '#888' }
        },
        series: [
            {
                name: 'Causales',
                type: 'pie',
                radius: ['50%', '80%'],
                center: ['40%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 4,
                    borderColor: '#0b1120',
                    borderWidth: 2,
                    color: (params: any) => getCausalColor(params.name)
                },
                label: { show: false },
                emphasis: {
                    label: { show: false }
                },
                labelLine: { show: false },
                data: chartData
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
            height: '100%'
        }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-color)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Distribución por Causal
            </h3>
            <div style={{ height: '300px' }}>
                <ReactECharts
                    option={option}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                />
            </div>
        </div>
    );
}
