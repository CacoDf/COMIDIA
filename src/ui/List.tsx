import { useId, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

export function ListSection({ header, footer, prominent, children, className }: {
  header?: ReactNode;
  footer?: ReactNode;
  prominent?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <section className={['group', className ?? ''].filter(Boolean).join(' ')} aria-labelledby={header ? id : undefined}>
      {header && (
        <h2 id={id} className={prominent ? 'group__header group__header--prominent t-title3' : 'group__header t-footnote'}>{header}</h2>
      )}
      <div className="group__body">{children}</div>
      {footer && <p className="group__footer t-footnote" style={{ margin: 0 }}>{footer}</p>}
    </section>
  );
}

type RowProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  detail?: ReactNode;
  leading?: ReactNode;
  chevron?: boolean;
  tone?: 'default' | 'action' | 'destructive';
  onClick?: () => void;
  ariaLabel?: string;
  disabled?: boolean;
};

export function ListRow({ title, subtitle, detail, leading, chevron, tone = 'default', onClick, ariaLabel, disabled }: RowProps) {
  const cls = ['row', leading ? 'row--with-leading' : '', tone !== 'default' ? `row--${tone}` : ''].filter(Boolean).join(' ');
  const content = (
    <>
      {leading && <span className="row__leading" aria-hidden="true">{leading}</span>}
      <span className="row__text">
        <span className="row__title" style={{ display: 'block' }}>{title}</span>
        {subtitle && <span className="row__subtitle t-subhead" style={{ display: 'block' }}>{subtitle}</span>}
      </span>
      {detail !== undefined && <span className="row__detail">{detail}</span>}
      {chevron && <ChevronRight className="row__chevron" size={18} strokeWidth={2.5} aria-hidden="true" />}
    </>
  );
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick} aria-label={ariaLabel} disabled={disabled}>
        {content}
      </button>
    );
  }
  return <div className={cls}>{content}</div>;
}
