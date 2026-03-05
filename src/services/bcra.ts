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
const API_URL = 'https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas';
const BASE_URL = isProd
  ? `https://corsproxy.io/?${encodeURIComponent(API_URL)}`
  : '/api/CentralDeDeudores/v1.0/Deudas';

export async function fetchHistorialCrediticio(cuit: string): Promise<BCRAHistorialResponse> {
  // Fetch from the historic endpoint
  const res = await fetch(`${BASE_URL}/Historicas/${cuit}`);
  if (!res.ok) {
    if (res.status === 404) {
      return { status: 404, results: null };
    }
    throw new Error('Error fetching historical data');
  }
  const data: BCRAHistorialResponse = await res.json();

  // Also try to fetch the current one (might have a more recent month)
  try {
    const currentRes = await fetch(`${BASE_URL}/${cuit}`);
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

export interface BCRAChequesResponse {
  status: number;
  results: any;
}

// Keeping this stubbed out for now as the user didn't provide actual endpoint mapping for cheques,
// but the interface could be utilized similarly if needed.
export async function fetchChequesRechazados(_cuit: string): Promise<BCRAChequesResponse | null> {
  // Use _cuit to bypass unused variable warning for now
  return null;
}
