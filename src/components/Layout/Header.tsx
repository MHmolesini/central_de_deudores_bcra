import { Building2 } from 'lucide-react';

export function Header() {
    return (
        <header style={{
            display: 'flex',
            alignItems: 'center',
            padding: '1.5rem 2rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, fontSize: '1.25rem' }}>
                <Building2 size={24} color="var(--accent-color)" />
                <span>Central de Deudores SaaS</span>
            </div>
        </header>
    );
}
