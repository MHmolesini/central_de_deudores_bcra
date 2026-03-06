export function Footer() {
    return (
        <footer style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            borderTop: '1px solid var(--border-color)',
            marginTop: 'auto'
        }}>
            <p>© {new Date().getFullYear()} Central de Deudores BCRA SaaS. Proyecto no oficial.</p>
            <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>Distribuido bajo la Licencia MIT.</p>
        </footer>
    );
}
