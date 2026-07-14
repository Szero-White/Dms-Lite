import { Card } from 'antd';
import styles from './GlassCard.module.css';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'heavy';
}

export function GlassCard({ children, className, intensity = 'medium' }: GlassCardProps) {
  return (
    <Card className={`${styles.glassCard} ${styles[intensity]} ${className || ''}`}>
      {children}
    </Card>
  );
}
