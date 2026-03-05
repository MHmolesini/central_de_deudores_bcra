import { Info, BookOpen, ShieldCheck } from 'lucide-react';
import styles from './InfoSection.module.css';

export function InfoSection() {
    return (
        <section className={styles.infoSection}>
            <h3 className={styles.title}>
                <BookOpen size={20} /> Guía de Consulta BCRA
            </h3>

            <div className={styles.grid}>
                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>Clasificación de Deudores</h4>
                    <div className={styles.statusList}>
                        <div className={styles.statusItem}>
                            <span className={styles.statusNumber}>1</span>
                            <span className={styles.statusDesc}><strong>Normal:</strong> Cumplimiento o atrasos ≤ 31 días.</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusNumber}>2</span>
                            <span className={styles.statusDesc}><strong>Riesgo Bajo:</strong> Atrasos de 31 a 90 días.</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusNumber}>3</span>
                            <span className={styles.statusDesc}><strong>Riesgo Medio:</strong> Atrasos de 90 a 180 días.</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusNumber}>4</span>
                            <span className={styles.statusDesc}><strong>Riesgo Alto:</strong> Atrasos de 180 días a 1 año.</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusNumber}>5</span>
                            <span className={styles.statusDesc}><strong>Irrecuperable:</strong> Atrasos &gt; 1 año.</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusNumber}>6</span>
                            <span className={styles.statusDesc}><strong>Irrecuperable por Disp. Técnica:</strong> Medida cautelar o liquidación.</span>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>Notas Importantes</h4>
                    <div className={styles.notes}>
                        <div className={styles.noteItem}>
                            <Info size={16} className={styles.bullet} />
                            <p>Los montos de deuda se encuentran expresados en <strong>miles de pesos</strong>.</p>
                        </div>
                        <div className={styles.noteItem}>
                            <ShieldCheck size={16} className={styles.bullet} />
                            <p>Los derechos de rectificación, actualización o supresión deben ejercerse ante la entidad informante.</p>
                        </div>
                        <div className={styles.noteItem}>
                            <Info size={16} className={styles.bullet} />
                            <p>La información es provista por la Central de Deudores del Sistema Financiero del BCRA.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
