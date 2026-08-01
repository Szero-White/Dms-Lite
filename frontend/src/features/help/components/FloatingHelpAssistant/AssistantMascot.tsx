import styles from './AssistantMascot.module.css';

interface AssistantMascotProps {
  compact?: boolean;
}

export function AssistantMascot({ compact = false }: AssistantMascotProps) {
  return (
    <div className={`${styles.mascot} ${compact ? styles.compactMascot : ''}`} aria-hidden="true">
      <div className={styles.mascotGlow} />
      <div className={styles.mascotCharacter}>
        <div className={styles.mascotHead}>
          <div className={styles.mascotAntenna} />
          <div className={styles.mascotFace}>
            <span />
            <span />
          </div>
          <div className={styles.mascotSmile} />
        </div>
        <div className={`${styles.mascotArm} ${styles.mascotArmLeft}`} />
        <div className={`${styles.mascotArm} ${styles.mascotArmRight}`} />
        <div className={styles.mascotBody}>
          <div className={styles.mascotBadge} />
        </div>
        <div className={`${styles.mascotFoot} ${styles.mascotFootLeft}`} />
        <div className={`${styles.mascotFoot} ${styles.mascotFootRight}`} />
      </div>
      <div className={styles.mascotShadow} />
    </div>
  );
}
