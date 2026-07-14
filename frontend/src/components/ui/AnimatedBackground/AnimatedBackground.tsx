import styles from './AnimatedBackground.module.css';

interface AnimatedBackgroundProps {
  variant?: 'gradient' | 'particles' | 'waves';
  intensity?: 'light' | 'medium' | 'heavy';
}

export function AnimatedBackground({ variant = 'gradient', intensity = 'medium' }: AnimatedBackgroundProps) {
  return (
    <div className={`${styles.animatedBackground} ${styles[variant]} ${styles[intensity]}`}>
      <div className={styles.backgroundLayer1}></div>
      <div className={styles.backgroundLayer2}></div>
      <div className={styles.backgroundLayer3}></div>
      {variant === 'particles' && (
        <>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
        </>
      )}
    </div>
  );
}
