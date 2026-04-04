// BottomNav — fixed 5-tab bar, always visible on authenticated screens.
// Active tab is derived from the current pathname, not stored in state,
// so deep links and browser back/forward always show the correct active tab.

import { NavLink } from 'react-router-dom';

interface TabDef {
  path: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const tabs: TabDef[] = [
  {
    path: '/today',
    label: 'Today',
    icon: (active) => (
      <svg viewBox="0 0 24 24" className={`w-[22px] h-[22px] ${active ? 'stroke-primary' : 'stroke-muted'}`}
        fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="4" x2="9" y2="9" />
        <line x1="15" y1="4" x2="15" y2="9" />
      </svg>
    ),
  },
  {
    path: '/areas',
    label: 'Areas',
    icon: (active) => (
      <svg viewBox="0 0 24 24" className={`w-[22px] h-[22px] ${active ? 'stroke-primary' : 'stroke-muted'}`}
        fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v9l4.5 4.5" />
      </svg>
    ),
  },
  {
    path: '/review',
    label: 'Review',
    icon: (active) => (
      <svg viewBox="0 0 24 24" className={`w-[22px] h-[22px] ${active ? 'stroke-primary' : 'stroke-muted'}`}
        fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="7" y1="13" x2="17" y2="13" />
        <line x1="7" y1="17" x2="13" y2="17" />
      </svg>
    ),
  },
  {
    path: '/insights',
    label: 'Insights',
    icon: (active) => (
      <svg viewBox="0 0 24 24" className={`w-[22px] h-[22px] ${active ? 'stroke-primary' : 'stroke-muted'}`}
        fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    path: '/me',
    label: 'Me',
    icon: (active) => (
      <svg viewBox="0 0 24 24" className={`w-[22px] h-[22px] ${active ? 'stroke-primary' : 'stroke-muted'}`}
        fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

export function BottomNav() {
  return (
    // fixed + left-1/2 + -translate-x-1/2 keeps the nav centred within the
    // max-app-width container even on wide desktop screens
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app h-nav
                    bg-bg/92 backdrop-blur-md border-t border-border z-50
                    flex items-stretch"
         style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
      {tabs.map(tab => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className="flex-1 flex flex-col items-center justify-center gap-1"
        >
          {({ isActive }) => (
            <>
              {tab.icon(isActive)}
              <span className={`text-[11px] font-medium tracking-wide ${isActive ? 'text-primary' : 'text-muted'}`}>
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
