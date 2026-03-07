import { useState } from 'react';
import { Footer } from './components/Layout/Footer';
import { SearchForm } from './components/Search/SearchForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { fetchHistorialCrediticio, fetchChequesRechazados, fetchExchangeRates, fetchInflationIndex, type BCRAHistorialResponse, type BCRAChequesResponse } from './services/bcra';
import { processMonthlyExchangeRates } from './utils/exchangeUtils';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historial, setHistorial] = useState<BCRAHistorialResponse | null>(null);
  const [cheques, setCheques] = useState<BCRAChequesResponse | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [inflationIndex, setInflationIndex] = useState<Record<string, number>>({});

  const handleSearch = async (cuit: string) => {
    setIsLoading(true);
    setError(null);
    setHistorial(null);
    setCheques(null);

    try {
      const [historialData, chequesData] = await Promise.all([
        fetchHistorialCrediticio(cuit),
        fetchChequesRechazados(cuit)
      ]);

      if (historialData.status !== 0 && historialData.status !== 200) {
        setError('No se pudo encontrar información para este CUIT/CUIL.');
      } else {
        setHistorial(historialData);
        setCheques(chequesData);

        // Intentamos obtener tipos de cambio e índices de inflación de forma independiente
        try {
          const [exchangeData, inflationData] = await Promise.all([
            fetchExchangeRates(),
            fetchInflationIndex()
          ]);

          if (exchangeData.results && exchangeData.results[0]?.detalle) {
            const processedRates = processMonthlyExchangeRates(exchangeData.results[0].detalle);
            setExchangeRates(processedRates);
          }

          if (inflationData.results && inflationData.results[0]?.detalle) {
            const processedInflation = processMonthlyExchangeRates(inflationData.results[0].detalle);
            setInflationIndex(processedInflation);
          }
        } catch (exErr) {
          console.warn("No se pudieron cargar los datos de variables financieras:", exErr);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Hubo un error al conectar con los servicios. Intentá de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main style={{ flex: 1, position: 'relative', paddingTop: '1rem' }}>
        {!historial && (
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        )}

        {error && (
          <div style={{ textAlign: 'center', color: 'var(--danger-color)', padding: '1rem' }}>
            {error}
          </div>
        )}

        {historial && (
          <div style={{ paddingBottom: '4rem' }}>
            <Dashboard
              historial={historial}
              cheques={cheques}
              exchangeRates={exchangeRates}
              inflationIndex={inflationIndex}
              onSearch={handleSearch}
              isLoading={isLoading}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
