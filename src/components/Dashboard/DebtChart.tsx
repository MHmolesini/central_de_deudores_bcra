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

    // Calculate dynamic bottom padding based on the number of banks in the legend.
    // Assuming each row of the legend takes roughly ~30px and can fit ~2-3 items on average.
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
                let text = `<strong>${params[0].name}</strong><br/>`;
                let total = 0;
                let prevTotal = 0;

                // dataIndex corresponds to the chronological order in our arrays
                const currentIndex = params[0].dataIndex;
                const prevIndex = currentIndex - 1;

                params.forEach((p: any) => {
                    if (p.value > 0) {
                        // Find the previous value for this specific bank to calculate variation
                        let prevValue = 0;
                        if (prevIndex >= 0) {
                            // Find the series data for the previous month
                            const seriesData = series.find(s => s.name === p.seriesName);
                            if (seriesData && seriesData.data[prevIndex]) {
                                prevValue = seriesData.data[prevIndex];
                            }
                        }

                        let variationStr = '';
                        if (prevValue > 0) {
                            const diff = p.value - prevValue;
                            if (diff !== 0) {
                                const pct = ((diff / prevValue) * 100).toFixed(1);
                                // Red if debt grew, Green if debt lowered
                                const color = diff > 0 ? '#ff4d4f' : '#50e3c2';
                                const sign = diff > 0 ? '+' : '';
                                variationStr = `<span style="color: ${color}; font-size: 0.85em; margin-left: 6px;">(${sign}${pct}%)</span>`;
                            }
                        } else if (prevIndex >= 0 && prevValue === 0) {
                            // New debt
                            variationStr = `<span style="color: #ff4d4f; font-size: 0.85em; margin-left: 6px;">(Nueva)</span>`;
                        }

                        text += `${p.marker} <span style="font-size: 0.8em">${p.seriesName}</span>: $${p.value.toLocaleString('es-AR')}M ${variationStr}<br/>`;
                        total += p.value;
                    }
                });

                // Calculate total variation
                if (prevIndex >= 0) {
                    series.forEach(s => {
                        if (s.data[prevIndex]) {
                            prevTotal += s.data[prevIndex];
                        }
                    });
                }

                let totalVarStr = '';
                if (prevTotal > 0) {
                    const diffTotal = total - prevTotal;
                    if (diffTotal !== 0) {
                        const pctTotal = ((diffTotal / prevTotal) * 100).toFixed(1);
                        const colorTotal = diffTotal > 0 ? '#ff4d4f' : '#50e3c2';
                        const signTotal = diffTotal > 0 ? '+' : '';
                        totalVarStr = `<span style="color: ${colorTotal}; font-size: 0.85em; margin-left: 6px;">(${signTotal}${pctTotal}%)</span>`;
                    }
                }

                text += `<hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:4px 0" /><strong>Total: $${total.toLocaleString('es-AR')}M ${totalVarStr}</strong>`;
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

    // Calculate dynamic height to ensure chart doesn't get squished
    const chartHeight = Math.max(480, 400 + (legendRows * 20));

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
