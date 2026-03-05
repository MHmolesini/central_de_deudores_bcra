import ReactECharts from 'echarts-for-react';
import type { BCRAPeriodo } from '../../services/bcra';

interface Props {
    data: BCRAPeriodo[];
}

export function DebtChart({ data }: Props) {
    // Extract periods and unique banks (entidades) to map series
    const periods = data.map((d) => d.periodo).reverse();

    const bankNames = new Set<string>();
    data.forEach((p) => p.entidades.forEach((e) => bankNames.add(e.entidad)));

    const banks = Array.from(bankNames);

    // Map data per bank
    const series = banks.map((bank, index) => {
        // Pastel colors from our CSS tokens or hardcoded map
        const pastelColors = [
            '#cbb4d4', // Purple
            '#84fab0', // Green
            '#8fd3f4', // Blue
            '#ffd194', // Orange
            '#ff9a9e'  // Pink
        ];

        const dataPoints = [...data].reverse().map((period) => {
            const match = period.entidades.find((e) => e.entidad === bank);
            return match ? match.monto : 0;
        });

        return {
            name: bank,
            type: 'bar',
            stack: 'total',
            itemStyle: {
                color: pastelColors[index % pastelColors.length],
                borderRadius: [4, 4, 0, 0] // Rounded tops
            },
            emphasis: { focus: 'series' },
            data: dataPoints
        };
    });

    // Calculate formatted labels (e.g., '0824' -> 'Ago 24')
    const formattedPeriods = periods.map(p => {
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
            backgroundColor: 'rgba(17, 17, 17, 0.9)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#ededed' },
            formatter: (params: any) => {
                let text = `<strong>${params[0].name}</strong><br/>`;
                let total = 0;
                params.forEach((p: any) => {
                    if (p.value > 0) {
                        text += `${p.marker} ${p.seriesName}: $${p.value.toLocaleString('es-AR')}<br/>`;
                        total += p.value;
                    }
                });
                text += `<strong>Total: $${total.toLocaleString('es-AR')}</strong>`;
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
            left: '3%',
            right: '4%',
            bottom: '15%',
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
                formatter: (value: number) => `$${(value / 1000)}k`
            },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }
        },
        series: series
    };

    return (
        <div style={{ height: '400px', width: '100%' }}>
            <ReactECharts
                option={options}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
            />
        </div>
    );
}
