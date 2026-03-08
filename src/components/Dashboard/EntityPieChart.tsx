import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { BCRAPeriodo } from '../../services/bcra';

interface Props {
    data: BCRAPeriodo[];
    currency: 'ARS' | 'USD' | 'ARS_REAL';
    exchangeRates: Record<string, number>;
    inflationIndex: Record<string, number>;
}

export function EntityPieChart({ data, currency, exchangeRates, inflationIndex }: Props) {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const latestPeriod: BCRAPeriodo = data[0];
        const { periodo, entidades } = latestPeriod;

        const total: number = entidades.reduce((acc: number, e: { monto: number }) => acc + e.monto, 0);
        let otherValue: number = 0;
        const mainEntities: { name: string; value: number }[] = [];

        entidades.forEach((entidad: { entidad: string; monto: number }) => {
            let value = entidad.monto;
            if (currency === 'USD') {
                const rate = exchangeRates[periodo] || exchangeRates[Object.keys(exchangeRates)[0]] || 1;
                value = value / rate;
            } else if (currency === 'ARS_REAL') {
                const index = inflationIndex[periodo] || inflationIndex[Object.keys(inflationIndex)[0]] || 1;
                value = value * index;
            }

            const pct = (entidad.monto / total) * 100;
            if (pct < 2 && entidades.length > 8) {
                otherValue += value;
            } else {
                mainEntities.push({
                    name: entidad.entidad,
                    value: Math.max(0, value)
                });
            }
        });

        const finalData = mainEntities.sort((a, b) => b.value - a.value);
        if (otherValue > 0) {
            finalData.push({
                name: 'OTROS',
                value: otherValue
            });
        }

        return finalData;
    }, [data, currency, exchangeRates, inflationIndex]);

    const formatValue = (value: number) => {
        const formatter = new Intl.NumberFormat('es-AR', {
            minimumFractionDigits: currency === 'ARS' ? 0 : 2,
            maximumFractionDigits: currency === 'ARS' ? 0 : 2
        });
        const prefix = currency === 'USD' ? 'USD ' : '$ ';
        const suffix = currency === 'USD' ? '' : 'M';
        return `${prefix}${formatter.format(value)}${suffix}`;
    };

    if (chartData.length === 0) {
        return (
            <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Sin datos de deuda para el último periodo.
            </div>
        );
    }

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(24, 24, 27, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#fff' },
            formatter: (params: any) => {
                return `${params.name}<br/>Deuda: <span style="font-weight:bold">${formatValue(params.value)}</span> (${params.percent}%)`;
            }
        },
        legend: {
            type: 'scroll',
            orient: 'vertical',
            right: 0,
            top: 'middle',
            textStyle: {
                color: '#888',
                fontSize: 12
            },
            pageIconColor: '#fff',
            pageTextStyle: { color: '#888' }
        },
        color: [
            '#cbb4d4', '#84fab0', '#8fd3f4', '#ffd194', '#ff9a9e',
            '#a1c4fd', '#fbc2eb', '#88d3ce', '#fbd72b', '#a18cd1',
            '#d4fc79', '#96e6a1', '#4facfe', '#f093fb', '#f6d365',
            '#667eea', '#30cfd0', '#ff758c', '#4fb576', '#0ba360',
            '#3cba92', '#df89b5', '#5f72bd', '#00c6ff'
        ],
        series: [
            {
                name: 'Deuda',
                type: 'pie',
                radius: ['50%', '80%'],
                center: ['40%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 4,
                    borderColor: '#0b1120',
                    borderWidth: 2
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
        <ReactECharts
            option={option}
            style={{ height: '350px', width: '100%' }}
            opts={{ renderer: 'svg' }}
        />
    );
}
