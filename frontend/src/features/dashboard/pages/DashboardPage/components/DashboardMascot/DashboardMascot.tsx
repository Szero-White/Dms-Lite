import { useId } from 'react';
import styles from './DashboardMascot.module.css';

interface DashboardMascotProps {
  size?: 'jumbo' | 'hero' | 'compact';
}

export function DashboardMascot({ size = 'hero' }: DashboardMascotProps) {
  const id = useId().replace(/:/g, '');
  const shellGradientId = `dashboard-mascot-shell-${id}`;
  const faceGradientId = `dashboard-mascot-face-${id}`;
  const purpleGradientId = `dashboard-mascot-purple-${id}`;
  const bodyGradientId = `dashboard-mascot-body-${id}`;
  const glassGradientId = `dashboard-mascot-glass-${id}`;
  const shadowGradientId = `dashboard-mascot-shadow-${id}`;

  return (
    <div className={`${styles.mascot} ${size === 'compact' ? styles.compact : size === 'jumbo' ? styles.jumbo : styles.hero}`} aria-hidden="true">
      <svg viewBox="0 0 260 260" role="presentation" focusable="false">
        <defs>
          <linearGradient id={shellGradientId} x1="52" y1="45" x2="194" y2="194" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.55" stopColor="#FBFAFF" />
            <stop offset="1" stopColor="#ECE9FF" />
          </linearGradient>
          <linearGradient id={faceGradientId} x1="82" y1="69" x2="177" y2="145" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3E3979" />
            <stop offset="0.55" stopColor="#27234E" />
            <stop offset="1" stopColor="#19172F" />
          </linearGradient>
          <linearGradient id={purpleGradientId} x1="74" y1="48" x2="194" y2="205" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9C94FF" />
            <stop offset="0.48" stopColor="#776EF1" />
            <stop offset="1" stopColor="#5750CC" />
          </linearGradient>
          <linearGradient id={bodyGradientId} x1="95" y1="151" x2="168" y2="225" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#F0EEFF" />
          </linearGradient>
          <linearGradient id={glassGradientId} x1="88" y1="73" x2="153" y2="128" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" stopOpacity="0.34" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={shadowGradientId} cx="0" cy="0" r="1" gradientTransform="translate(130 228) rotate(90) scale(18 58)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#625AD8" stopOpacity="0.22" />
            <stop offset="1" stopColor="#625AD8" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse className={styles.floorShadow} cx="130" cy="228" rx="58" ry="18" fill={`url(#${shadowGradientId})`} />

        <g className={styles.robotBody}>
          <g className={styles.antenna}>
            <path d="M130 48V32" stroke={`url(#${purpleGradientId})`} strokeWidth="8" strokeLinecap="round" />
            <circle cx="130" cy="24" r="10" fill={`url(#${purpleGradientId})`} />
            <circle cx="127" cy="20" r="3.4" fill="#FFFFFF" fillOpacity="0.42" />
          </g>

          <g className={styles.headGroup}>
            <rect x="55" y="47" width="150" height="112" rx="48" fill={`url(#${shellGradientId})`} stroke="#DCD8FF" strokeWidth="3" />
            <rect x="70" y="62" width="120" height="82" rx="34" fill={`url(#${faceGradientId})`} />
            <path d="M82 73C103 62 148 61 176 74C157 68 118 70 91 82Z" fill={`url(#${glassGradientId})`} />

            <g className={styles.leftEye}>
              <circle cx="108" cy="102" r="13" fill="#FFFFFF" />
              <circle cx="109" cy="104" r="7" fill={`url(#${purpleGradientId})`} />
              <circle cx="112" cy="100" r="2.2" fill="#FFFFFF" />
            </g>
            <g className={styles.rightEye}>
              <circle cx="153" cy="102" r="13" fill="#FFFFFF" />
              <circle cx="154" cy="104" r="7" fill={`url(#${purpleGradientId})`} />
              <circle cx="157" cy="100" r="2.2" fill="#FFFFFF" />
            </g>

            <path className={styles.smile} d="M112 122C120 132 141 132 149 122" stroke="#C8C4FF" strokeWidth="6" strokeLinecap="round" />
            <ellipse cx="93" cy="121" rx="10" ry="5" fill="#8D83F3" fillOpacity="0.42" />
            <ellipse cx="168" cy="121" rx="10" ry="5" fill="#8D83F3" fillOpacity="0.42" />

            <g className={styles.earLeft}>
              <rect x="43" y="77" width="22" height="54" rx="11" fill={`url(#${purpleGradientId})`} />
              <rect x="48" y="85" width="11" height="38" rx="5.5" fill="#C9C5FF" fillOpacity="0.55" />
            </g>
            <g className={styles.earRight}>
              <rect x="195" y="77" width="22" height="54" rx="11" fill={`url(#${purpleGradientId})`} />
              <rect x="201" y="85" width="10" height="38" rx="5" fill="#C9C5FF" fillOpacity="0.55" />
            </g>
          </g>

          <g className={styles.torso}>
            <path d="M93 150H167C181 150 192 161 192 175V196C192 214 178 228 160 228H100C82 228 68 214 68 196V175C68 161 79 150 93 150Z" fill={`url(#${bodyGradientId})`} stroke="#DCD8FF" strokeWidth="3" />
            <rect x="111" y="169" width="38" height="38" rx="13" fill={`url(#${purpleGradientId})`} />
            <path d="M120 187H140" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
            <path d="M130 177V197" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity=".86" />
          </g>

          <g className={styles.leftArm}>
            <path d="M75 169C56 166 45 154 40 141" stroke="#C6C2FF" strokeWidth="18" strokeLinecap="round" />
            <circle cx="39" cy="139" r="13" fill={`url(#${purpleGradientId})`} />
          </g>

          <g className={styles.rightArm}>
            <path d="M185 166C204 160 216 147 218 132" stroke="#C6C2FF" strokeWidth="18" strokeLinecap="round" />
            <g className={styles.waveHand}>
              <circle cx="220" cy="128" r="14" fill={`url(#${purpleGradientId})`} />
              <path d="M217 117L215 106" stroke={`url(#${purpleGradientId})`} strokeWidth="7" strokeLinecap="round" />
              <path d="M224 116L228 106" stroke={`url(#${purpleGradientId})`} strokeWidth="7" strokeLinecap="round" />
              <path d="M230 120L238 113" stroke={`url(#${purpleGradientId})`} strokeWidth="7" strokeLinecap="round" />
            </g>
          </g>

          <g className={styles.leftLeg}>
            <path d="M102 223V233" stroke="#BBB7FA" strokeWidth="16" strokeLinecap="round" />
            <path d="M88 238H109" stroke={`url(#${purpleGradientId})`} strokeWidth="12" strokeLinecap="round" />
          </g>
          <g className={styles.rightLeg}>
            <path d="M158 223V233" stroke="#BBB7FA" strokeWidth="16" strokeLinecap="round" />
            <path d="M151 238H172" stroke={`url(#${purpleGradientId})`} strokeWidth="12" strokeLinecap="round" />
          </g>
        </g>

        <g className={styles.sparkles}>
          <path d="M31 70V84M24 77H38" stroke="#8A82F2" strokeWidth="4" strokeLinecap="round" />
          <path d="M221 63V73M216 68H226" stroke="#A39CFF" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M219 186V198M213 192H225" stroke="#8A82F2" strokeWidth="3.5" strokeLinecap="round" />
        </g>

        <g className={styles.chatCard}>
          <rect x="166" y="22" width="74" height="40" rx="14" fill="#FFFFFF" stroke="#DFDCFF" strokeWidth="2" />
          <rect x="181" y="36" width="31" height="5" rx="2.5" fill="#7A72F2" fillOpacity="0.72" />
          <rect x="181" y="47" width="42" height="4" rx="2" fill="#B0AAF7" fillOpacity="0.52" />
        </g>

        <g className={styles.dataCard}>
          <rect x="22" y="159" width="65" height="48" rx="15" fill="#FFFFFF" stroke="#DFDCFF" strokeWidth="2" />
          <rect x="35" y="183" width="7" height="12" rx="3" fill="#A39CFF" />
          <rect x="48" y="176" width="7" height="19" rx="3" fill="#8A82F2" />
          <rect x="61" y="169" width="7" height="26" rx="3" fill="#6F68E8" />
        </g>
      </svg>
    </div>
  );
}
