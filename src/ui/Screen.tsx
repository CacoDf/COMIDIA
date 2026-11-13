import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
  title: string;
  /** Título grande que colapsa al hacer scroll (pantallas principales). Las de detalle usan título en línea. */
  large?: boolean;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  tabbar?: boolean;
  children: ReactNode;
};

export function Screen({ title, large = true, subtitle, leading, trailing, tabbar = true, children }: Props) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { rootMargin: '-44px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className={tabbar ? 'screen' : 'screen screen--no-tabbar'}>
      <header className="navbar" data-scrolled={scrolled || !large ? 'true' : 'false'} data-inline={large ? 'false' : 'true'}>
        <div className="navbar__leading">{leading}</div>
        {large ? <div className="navbar__title" aria-hidden="true">{title}</div> : <h1 className="navbar__title t-headline">{title}</h1>}
        <div className="navbar__trailing">{trailing}</div>
      </header>
      {large && (
        <div className="large-title">
          <h1 className="t-large-title">{title}</h1>
          {subtitle && <div className="large-title__sub t-subhead c-secondary">{subtitle}</div>}
        </div>
      )}
      <div ref={sentinel} aria-hidden="true" />
      <main className="screen__body">{children}</main>
    </div>
  );
}
