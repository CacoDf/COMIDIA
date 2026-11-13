import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'filled' | 'tinted' | 'plain' | 'destructive';
  size?: 'regular' | 'large';
  loading?: boolean;
  children: ReactNode;
};

export function Button({ variant = 'filled', size = 'regular', loading = false, disabled, className, children, type = 'button', ...rest }: Props) {
  const cls = ['btn', `btn--${variant}`, size === 'large' ? 'btn--large' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <button {...rest} type={type} className={cls} disabled={disabled || loading} aria-busy={loading ? 'true' : undefined}>
      {children}
    </button>
  );
}

/** Botón de texto o ícono para la barra de navegación. */
export function BarButton({ bold, className, children, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { bold?: boolean }) {
  return (
    <button {...rest} type={type} className={['bar-button', bold ? 'bar-button--bold' : '', className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </button>
  );
}
