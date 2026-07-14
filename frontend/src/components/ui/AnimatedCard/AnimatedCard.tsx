import { Card } from 'antd';
import styles from './AnimatedCard.module.css';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedCard({ children, className, delay = 0 }: AnimatedCardProps) {
  return (
    <Card 
      className={`${styles.animatedCard} ${className || ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </Card>
  );
}
