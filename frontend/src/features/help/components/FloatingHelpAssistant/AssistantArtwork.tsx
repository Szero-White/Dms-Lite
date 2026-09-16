import { useId } from 'react';
import styles from './AssistantArtwork.module.css';

type AssistantArtworkVariant = 'launcher' | 'avatar' | 'hero';

interface AssistantArtworkProps {
  variant?: AssistantArtworkVariant;
}

export function AssistantArtwork({ variant = 'hero' }: AssistantArtworkProps) {
  const rawId = useId();
  const id = rawId.replace(/:/g, '');
  const faceGradientId = `assistant-face-${id}`;
  const bodyGradientId = `assistant-body-${id}`;
  const glowGradientId = `assistant-glow-${id}`;
  const launcherGradientId = `assistant-launcher-${id}`;

  if (variant === 'launcher') {
    return (
      <span className={`${styles.artwork} ${styles.launcherArtwork}`} aria-hidden="true">
        <svg viewBox="0 0 48 48" role="presentation" focusable="false">
          <defs>
            <linearGradient id={launcherGradientId} x1="10" y1="12" x2="38" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8A7CFF" />
              <stop offset=".5" stopColor="#6C63FF" />
              <stop offset="1" stopColor="#5147D8" />
            </linearGradient>
          </defs>

          <g className={styles.launcherMark}>
            <g className={styles.launcherOrbit} fill="none" stroke={`url(#${launcherGradientId})`} strokeLinecap="round">
              <path d="M11.2 19.3A15.2 15.2 0 0 1 25.4 9.2" strokeWidth="2.25" opacity=".78" />
              <path d="M36.8 28.7A15.2 15.2 0 0 1 22.6 38.8" strokeWidth="2.25" opacity=".58" />
            </g>

            <g className={styles.launcherGlyph} fill={`url(#${launcherGradientId})`}>
              <path d="M13.6 31.8 19.9 15h4.7l6.3 16.8h-4.2l-1.3-3.7h-6.5l-1.3 3.7h-4Zm6.5-7.1h4.1l-2.1-5.9-2 5.9Z" />
              <rect x="32.3" y="15" width="3.9" height="16.8" rx="1.8" />
            </g>

            <g className={styles.launcherSpark} fill={`url(#${launcherGradientId})`}>
              <path d="M36.6 10.3c.45 2.45 1.72 3.72 4.17 4.17-2.45.45-3.72 1.72-4.17 4.17-.45-2.45-1.72-3.72-4.17-4.17 2.45-.45 3.72-1.72 4.17-4.17Z" />
              <path d="M40.4 19.8c.24 1.32.93 2.01 2.25 2.25-1.32.24-2.01.93-2.25 2.25-.24-1.32-.93-2.01-2.25-2.25 1.32-.24 2.01-.93 2.25-2.25Z" opacity=".72" />
            </g>
          </g>
        </svg>
      </span>
    );
  }

  const isAvatar = variant === 'avatar';

  return (
    <span className={`${styles.artwork} ${isAvatar ? styles.avatarArtwork : styles.heroArtwork}`} aria-hidden="true">
      <svg viewBox="0 0 180 180" role="presentation" focusable="false">
        <defs>
          <linearGradient id={faceGradientId} x1="54" y1="54" x2="128" y2="118" gradientUnits="userSpaceOnUse">
            <stop stopColor="#746CFF" />
            <stop offset="1" stopColor="#4338CA" />
          </linearGradient>
          <linearGradient id={bodyGradientId} x1="74" y1="105" x2="112" y2="157" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#EAE9FF" />
          </linearGradient>
          <radialGradient id={glowGradientId} cx="0" cy="0" r="1" gradientTransform="translate(90 90) rotate(90) scale(78)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A9A3FF" stopOpacity=".22" />
            <stop offset=".66" stopColor="#8B83FF" stopOpacity=".08" />
            <stop offset="1" stopColor="#8B83FF" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="90" cy="90" r="77" fill={`url(#${glowGradientId})`} className={styles.aura} />
        <ellipse cx="90" cy="91" rx="70" ry="42" fill="none" stroke="#8B83FF" strokeOpacity=".2" strokeWidth="1.4" className={styles.orbit} />
        <ellipse cx="90" cy="91" rx="48" ry="70" fill="none" stroke="#8B83FF" strokeOpacity=".11" strokeWidth="1.2" transform="rotate(58 90 91)" />

        <g className={styles.orbitDots}>
          <circle cx="26" cy="92" r="5" fill="#9A93FF" />
          <circle cx="143" cy="62" r="3.8" fill="#6C63FF" />
          <circle cx="145" cy="126" r="5.5" fill="#AAA5FF" />
          <circle cx="63" cy="30" r="3" fill="#C8C5FF" />
        </g>

        <ellipse cx="90" cy="149" rx="35" ry="8" fill="#394465" fillOpacity=".09" className={styles.shadow} />

        <g className={styles.robot}>
          <path d="M90 37V27" fill="none" stroke="#675FF4" strokeLinecap="round" strokeWidth="3" />
          <circle cx="90" cy="24" r="5" fill="#6C63FF" />
          <circle cx="90" cy="24" r="9" fill="#6C63FF" fillOpacity=".09" />

          <rect x="53" y="43" width="74" height="62" rx="25" fill="#FFFFFF" stroke="#D9D7FF" strokeWidth="2" />
          <rect x="60" y="51" width="60" height="45" rx="18" fill={`url(#${faceGradientId})`} />
          <path d="M48 65h-3c-5 0-9 4-9 9v7c0 5 4 9 9 9h3" fill="#C9C6FF" />
          <path d="M132 65h3c5 0 9 4 9 9v7c0 5-4 9-9 9h-3" fill="#C9C6FF" />

          <g className={styles.eyes}>
            <path d="M73 72c2.1-3.5 7.5-3.5 9.6 0" fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="4" />
            <path d="M97.4 72c2.1-3.5 7.5-3.5 9.6 0" fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="4" />
          </g>
          <path d="M78 83c6.4 5.4 17.6 5.4 24 0" fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3.4" />

          <path d="M68 102h44l9 34c1.6 6.1-3 12-9.3 12H68.3c-6.3 0-10.9-5.9-9.3-12l9-34Z" fill={`url(#${bodyGradientId})`} stroke="#D9D7FF" strokeWidth="2" />
          <circle cx="90" cy="123" r="7" fill="#6C63FF" />
          <circle cx="90" cy="123" r="12" fill="#6C63FF" fillOpacity=".09" />

          <g className={styles.leftArm}>
            <path d="M62 111 47 120" fill="none" stroke="#B8B4FF" strokeLinecap="round" strokeWidth="9" />
            <circle cx="44" cy="122" r="7" fill="#9D97FF" />
          </g>
          <g className={styles.rightArm}>
            <path d="m118 109 13-15" fill="none" stroke="#B8B4FF" strokeLinecap="round" strokeWidth="9" />
            <circle cx="134" cy="91" r="7" fill="#8A83FF" />
          </g>

          <path d="M72 149v6" fill="none" stroke="#B8B4FF" strokeLinecap="round" strokeWidth="8" />
          <path d="M108 149v6" fill="none" stroke="#B8B4FF" strokeLinecap="round" strokeWidth="8" />
          <path d="M61 158h23" fill="none" stroke="#AAA5FF" strokeLinecap="round" strokeWidth="8" />
          <path d="M96 158h23" fill="none" stroke="#AAA5FF" strokeLinecap="round" strokeWidth="8" />
        </g>

        {!isAvatar ? (
          <g className={styles.waveMarks}>
            <path d="M146 79 154 73" fill="none" stroke="#6C63FF" strokeLinecap="round" strokeWidth="3.5" />
            <path d="m149 88 10-1" fill="none" stroke="#6C63FF" strokeLinecap="round" strokeWidth="3.5" />
            <path d="m143 70 3-9" fill="none" stroke="#6C63FF" strokeLinecap="round" strokeWidth="3.5" />
          </g>
        ) : null}
      </svg>
    </span>
  );
}
