import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import styles from './SearchForm.module.css';

interface Props {
    onSearch: (cuit: string) => void;
    isLoading: boolean;
    compact?: boolean;
}

export function SearchForm({ onSearch, isLoading, compact = false }: Props) {
    const [cuit, setCuit] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (cuit.trim().length >= 8) {
            onSearch(cuit.trim());
        }
    };

    if (compact) {
        return (
            <form onSubmit={handleSubmit} className={styles.compactForm}>
                <div className={styles.compactInputWrapper}>
                    <Search className={styles.compactIcon} size={16} />
                    <input
                        type="text"
                        className={styles.compactInput}
                        placeholder="Buscar otro CUIT/CUIL..."
                        value={cuit}
                        onChange={(e) => setCuit(e.target.value.replace(/\D/g, ''))}
                        maxLength={11}
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    className={styles.compactButton}
                    disabled={cuit.length < 8 || isLoading}
                >
                    {isLoading ? <Loader2 className={styles.spin} size={16} /> : 'Buscar'}
                </button>
            </form>
        );
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Consultar Situación Crediticia</h1>
            <p className={styles.subtitle}>Ingresá el CUIT o CUIL para obtener un informe detallado basado en la Central de Deudores del BCRA.</p>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputWrapper}>
                    <Search className={styles.icon} size={20} />
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="Ej: 2040100854"
                        value={cuit}
                        onChange={(e) => setCuit(e.target.value.replace(/\D/g, ''))}
                        maxLength={11}
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    className={styles.button}
                    disabled={cuit.length < 8 || isLoading}
                >
                    {isLoading ? <Loader2 className={styles.spin} size={20} /> : 'Buscar'}
                </button>
            </form>
        </div>
    );
}
