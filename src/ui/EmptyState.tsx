import type { ReactNode } from 'react';

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      {icon && <div className="empty__icon" aria-hidden="true">{icon}</div>}
      <p className="t-headline">{title}</p>
      {children && <p className="empty__text t-subhead" style={{ margin: 0 }}>{children}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}
