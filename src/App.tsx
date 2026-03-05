import { useState } from 'react';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { SearchForm } from './components/Search/SearchForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { fetchHistorialCrediticio, fetchChequesRechazados, type BCRAHistorialResponse, type BCRAChequesResponse } from './services/bcra';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historial, setHistorial] = useState<BCRAHistorialResponse | null>(null);
  const [cheques, setCheques] = useState<BCRAChequesResponse | null>(null);

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

      if (historialData.status !== 0) {
        setError('No se pudo encontrar información para este CUIT/CUIL.');
      } else {
        setHistorial(historialData);
        setCheques(chequesData);
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
      <Header />

      <main style={{ flex: 1, position: 'relative' }}>
        {/* Abstract background blobs for premium aesthetic */}
        <div style={{
          position: 'absolute',
          top: '-10%', left: '-5%', width: '30%', height: '50%',
          background: 'radial-gradient(circle, rgba(0,112,243,0.15) 0%, rgba(0,0,0,0) 70%)',
          zIndex: -1, pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: '20%', right: '-10%', width: '40%', height: '60%',
          background: 'radial-gradient(circle, rgba(132,250,176,0.1) 0%, rgba(0,0,0,0) 70%)',
          zIndex: -1, pointerEvents: 'none'
        }} />

        <SearchForm onSearch={handleSearch} isLoading={isLoading} />

        {error && (
          <div style={{ textAlign: 'center', color: 'var(--danger-color)', padding: '1rem' }}>
            {error}
          </div>
        )}

        {historial && (
          <div style={{ paddingBottom: '4rem' }}>
            <Dashboard historial={historial} cheques={cheques} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
