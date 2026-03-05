import ReactECharts from 'echarts-for-react';
import type { BCRAPeriodo } from '../../services/bcra';

interface Props {
    data: BCRAPeriodo[];
}

export function InflowChart({ data }: Props) {
    // Extract periods and unique banks (entidades) to map series
    const periods = data.map((d) => d.periodo).reverse();

    const bankNames = new Set<string>();
    data.forEach((p) => p.entidades.forEach((e) => bankNames.add(e.entidad)));
    const banks = Array.from(bankNames);

    // Calculate variations per bank per period
    // The first period in the reversed array (oldest) has no previous period to compare against, so its variation is 0 or we skip it.

    const series = banks.map((bank, index) => {
        const pastelColors = [
            '#cbb4d4', '#84fab0', '#8fd3f4', '#ffd194', '#ff9a9e'
        ];

        // Map through the reversed data (oldest to newest)
        const reversedData = [...data].reverse();
        const dataPoints = reversedData.map((period, pIdx) => {
            const match = period.entidades.find((e) => e.entidad === bank);
            const currentMonto = match ? match.monto : 0;

            let prevMonto = 0;
            if (pIdx > 0) {
                const prevMatch = reversedData[pIdx - 1].entidades.find((e) => e.entidad === bank);
                prevMonto = prevMatch ? prevMatch.monto : 0;
            } else {
                // For the very first month, variation is technically unknowable. We can treat it as 0
                return 0;
            }

            const diff = currentMonto - prevMonto;
            return diff;
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
            backgroundColor: '#0a0a0a',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            textStyle: { color: '#ededed' },
            formatter: (params: any) => {
                let text = `<strong>${params[0].name} (Variación)</strong><br/>`;
                let netChange = 0;

                params.forEach((p: any) => {
                    if (p.value !== 0) {
                        const color = p.value > 0 ? '#ff4d4f' : '#50e3c2'; // Red for debt increase, Green for debt decrease
                        const sign = p.value > 0 ? '+' : '';
                        text += `${p.marker} <span style="font-size: 0.8em">${p.seriesName}</span>: <span style="color:${color}">$${sign}${p.value.toLocaleString('es-AR')}M</span><br/>`;
                        netChange += p.value;
                    }
                });

                if (netChange !== 0) {
                    const totalColor = netChange > 0 ? '#ff4d4f' : '#50e3c2';
                    const totalSign = netChange > 0 ? '+' : '';
                    text += `<hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:4px 0" /><strong>Total Variación: <span style="color:${totalColor}">$${totalSign}${netChange.toLocaleString('es-AR')}M</span></strong>`;
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
                formatter: (value: number) => `$${value.toLocaleString('es-AR')}M`
            },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }
        },
        series: series
    };

    const chartHeight = Math.max(400, 320 + (legendRows * 20));

    return (
        <div style={{ height: `${chartHeight}px`, width: '100%' }}>
            <ReactECharts
                option={options}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
            />
        </div>
    );
}
