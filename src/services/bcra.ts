export interface BCRAEntidadPeriodo {
  entidad: string;
  situacion: number;
  fechaSit1?: string;
  monto: number;
  diasAtrasoPago?: number;
  refinanciaciones?: boolean;
  recategorizacionOblig?: boolean;
  situacionJuridica?: boolean;
  irrecDisposicionTecnica?: boolean;
  enRevision: boolean;
  procesoJud: boolean;
}

export interface BCRAPeriodo {
  periodo: string; // YYYYMM format in real API
  entidades: BCRAEntidadPeriodo[];
}

export interface BCRAHistorialResponse {
  status: number;
  results: {
    identificacion: number;
    denominacion: string;
    periodos: BCRAPeriodo[];
  } | null;
}

// We'll use the vite proxy locally, but a public proxy for GitHub Pages
const isProd = import.meta.env.PROD;
const DEUDAS_API_URL = 'https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas';
const STATS_API_URL = 'https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias';

const getUrl = (baseUrl: string, path: string) => {
  const fullUrl = `${baseUrl}${path}`;
  if (isProd) {
    return `https://corsproxy.io/?${encodeURIComponent(fullUrl)}`;
  }
  // Reemplazamos la base de la API por el prefijo configurado en Vite
  return fullUrl.replace('https://api.bcra.gob.ar', '/bcra-api');
};

export async function fetchHistorialCrediticio(cuit: string): Promise<BCRAHistorialResponse> {
  const baseDeudas = DEUDAS_API_URL;
  // Fetch from the historic endpoint
  const res = await fetch(getUrl(baseDeudas, `/Historicas/${cuit}`));
  if (!res.ok) {
    if (res.status === 404) {
      return { status: 404, results: null };
    }
    throw new Error('Error fetching historical data');
  }
  const data: BCRAHistorialResponse = await res.json();

  // Also try to fetch the current one (might have a more recent month)
  try {
    const currentRes = await fetch(getUrl(baseDeudas, `/${cuit}`));
    if (currentRes.ok) {
      const currentData: BCRAHistorialResponse = await currentRes.json();

      // If we have both, we can merge them to ensure we have the most recent month
      if (data.results && currentData.results && currentData.results.periodos.length > 0) {
        const latestCurrentPeriod = currentData.results.periodos[0];

        // If the current endpoint has a newer month than the historic one, prepend it
        if (data.results.periodos.length === 0 ||
          parseInt(latestCurrentPeriod.periodo) > parseInt(data.results.periodos[0].periodo)) {
          data.results.periodos.unshift(latestCurrentPeriod);
        }
      }
    }
  } catch (e) {
    console.warn("Could not fetch current endpoint, relying on historic only", e);
  }

  return data;
}

export interface BCRAEstadoMulta {
  // Can be "IMPAGA" or null based on the response
}

export interface BCRAChequeDetalle {
  nroCheque: number;
  fechaRechazo: string;
  monto: number;
  fechaPago: string | null;
  fechaPagoMulta: string | null;
  estadoMulta: string | null;
  ctaPersonal: boolean;
  denomJuridica: string | null;
  enRevision: boolean;
  procesoJud: boolean;
}

export interface BCRAChequesEntidad {
  entidad: number;
  detalle: BCRAChequeDetalle[];
}

export interface BCRAChequesCausal {
  causal: string;
  entidades: BCRAChequesEntidad[];
}

export interface BCRAChequesResponse {
  status: number;
  results: {
    identificacion: number;
    denominacion: string;
    causales: BCRAChequesCausal[];
  };
}

export async function fetchChequesRechazados(cuit: string): Promise<BCRAChequesResponse | null> {
  const baseDeudas = DEUDAS_API_URL;
  try {
    const res = await fetch(getUrl(baseDeudas, `/ChequesRechazados/${cuit}`));
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Error fetching bounced checks');
    }
    return res.json();
  } catch (e) {
    console.warn("Could not fetch bounced checks", e);
    return null;
  }
}

export interface BCRAExchangeRate {
  fecha: string;
  valor: number;
}

export interface BCRAExchangeRateResponse {
  status: number;
  results: {
    idVariable: number;
    detalle: BCRAExchangeRate[];
  }[];
}

export async function fetchExchangeRates(): Promise<BCRAExchangeRateResponse> {
  const res = await fetch(getUrl(STATS_API_URL, '/5'));
  if (!res.ok) {
    throw new Error('Error fetching exchange rates');
  }
  return res.json();
}

/**
 * Obtiene el índice de inflación (Variable 30 - CER)
 */
export async function fetchInflationIndex(): Promise<BCRAExchangeRateResponse> {
  const res = await fetch(getUrl(STATS_API_URL, '/30'));
  if (!res.ok) {
    throw new Error('Error fetching inflation index');
  }
  return res.json();
}
