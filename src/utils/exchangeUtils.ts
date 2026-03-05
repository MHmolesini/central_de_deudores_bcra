import type { BCRAExchangeRate } from '../services/bcra';

/**
 * Procesa la lista de tipos de cambio diarios para obtener el último valor disponible de cada mes.
 * @param rates Lista de tipos de cambio diarios [{fecha: 'YYYY-MM-DD', valor: number}, ...]
 * @returns Un mapa de periodos (YYYYMM) a su tipo de cambio correspondiente.
 */
export function processMonthlyExchangeRates(rates: BCRAExchangeRate[]): Record<string, number> {
    const monthlyRates: Record<string, { date: string; value: number }> = {};

    rates.forEach((rate) => {
        // La fecha viene en formato YYYY-MM-DD
        const dateParts = rate.fecha.split('-');
        if (dateParts.length < 2) return;

        const period = `${dateParts[0]}${dateParts[1]}`; // YYYYMM

        // Si no tenemos este mes, o si esta fecha es posterior a la guardada, actualizamos
        if (!monthlyRates[period] || rate.fecha > monthlyRates[period].date) {
            monthlyRates[period] = {
                date: rate.fecha,
                value: rate.valor,
            };
        }
    });

    // Convertimos a un mapa simple de YYYYMM -> valor
    const result: Record<string, number> = {};
    Object.keys(monthlyRates).forEach((period) => {
        result[period] = monthlyRates[period].value;
    });

    return result;
}
