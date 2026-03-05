import { AlertTriangle, CheckCircle, HelpCircle, AlertCircle, XCircle } from 'lucide-react';
import styles from './StatusIndicator.module.css';

interface Props {
    situacion?: number;
}

export function StatusIndicator({ situacion }: Props) {
    if (situacion === undefined || situacion === null) return null;

    const config: Record<number, { label: string; colorClass: string; icon: any }> = {
        0: { label: 'Sin datos', colorClass: styles.gray, icon: HelpCircle },
        1: { label: 'Normal', colorClass: styles.green, icon: CheckCircle },
        2: { label: 'Riesgo Bajo', colorClass: styles.yellow, icon: AlertTriangle },
        3: { label: 'Riesgo Medio', colorClass: styles.orange, icon: AlertCircle },
        4: { label: 'Riesgo Alto', colorClass: styles.red, icon: XCircle },
        5: { label: 'Irrecuperable', colorClass: styles.darkred, icon: XCircle },
        6: { label: 'Irrecuperable por Disp. Tec.', colorClass: styles.darkred, icon: XCircle }
    };

    const currentConfig = config[situacion] || config[0];
    const Icon = currentConfig.icon;

    return (
        <div className={`${styles.indicator} ${currentConfig.colorClass}`}>
            <Icon size={16} />
            <span className={styles.label}>Sit. {situacion} - {currentConfig.label}</span>
        </div>
    );
}
