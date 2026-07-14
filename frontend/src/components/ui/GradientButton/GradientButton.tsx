import { Button } from 'antd';
import styles from './GradientButton.module.css';

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'small' | 'middle' | 'large';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

export function GradientButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'middle',
  icon,
  loading,
  disabled 
}: GradientButtonProps) {
  return (
    <Button
      className={`${styles.gradientButton} ${styles[variant]}`}
      onClick={onClick}
      size={size}
      icon={icon}
      loading={loading}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
