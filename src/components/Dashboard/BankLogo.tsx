import { useState } from 'react';
import { Building2 } from 'lucide-react';

interface Props {
    bankName: string;
    size?: number;
}

export function BankLogo({ bankName, size = 40 }: Props) {
    const [error, setError] = useState(false);

    // Normalizar el nombre para mapearlo al nombre del archivo SVG
    const getLogoFilename = (name: string) => {
        const normalized = name.toLowerCase();

        // Mapeos manuales (podés agregar más a medida que sumes SVGs a public/logos)
        if (normalized.includes('santander')) return 'santander.svg';
        if (normalized.includes('galicia')) return 'galicia.svg';
        if (normalized.includes('mercadolibre') || normalized.includes('mercado libre')) return 'mercadolibre.svg';
        if (normalized.includes('icbc') || normalized.includes('industrial and commercial')) return 'icbc.svg';
        if (normalized.includes('bbva')) return 'bbva.svg';
        if (normalized.includes('macro')) return 'macro.svg';
        if (normalized.includes('american express')) return 'amex.svg';
        if (normalized.includes('supervielle')) return 'supervielle.svg';
        if (normalized.includes('valores')) return 'valores.svg';
        if (normalized.includes('ypf')) return 'ypf.svg';
        if (normalized.includes('credicoop')) return 'credicoop.svg';
        if (normalized.includes('comafi')) return 'comafi.svg';
        if (normalized.includes('ciudad')) return 'ciudad.svg';
        if (normalized.includes('provincia')) return 'provincia.svg';

        // Para el futuro, si querés agregar más, podes guiñarlos acá:
        // if (normalized.includes('nacion')) return 'nacion.svg';
        // if (normalized.includes('macro')) return 'macro.svg';

        return null;
    };

    const filename = getLogoFilename(bankName);

    // Fallback: Ícono de edificio si el banco no tiene logo asignado o falló la carga
    if (!filename || error) {
        return (
            <div style={{
                width: size,
                height: size,
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                flexShrink: 0,
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <Building2 size={size * 0.5} />
            </div>
        );
    }

    return (
        <img
            src={`${import.meta.env.BASE_URL}logos/${filename}`}
            alt={`Logo de ${bankName}`}
            style={{
                width: size,
                height: size,
                borderRadius: '8px',
                objectFit: 'contain',
                overflow: 'hidden',
                flexShrink: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '4px'
            }}
            onError={() => setError(true)}
        />
    );
}
