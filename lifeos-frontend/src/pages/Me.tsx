// Me — Phase 2 scaffold. North star, rocks, habits config in Phase 8.

import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Me() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="page">
      <h1 className="text-[26px] font-semibold tracking-tight text-primary mb-0.5">Me</h1>
      <p className="text-sm text-muted mb-9">{user?.email}</p>

      {/* North star */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">North star</p>
        <p className="text-sm text-primary leading-relaxed">
          Full-time digital nomad swing trader by Q2 2028
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-8">
        {[
          'Quarterly rocks',
          'Monthly intentions',
          'Habits',
          'Life tasks',
          'Account settings',
        ].map(item => (
          <div key={item}
               className="bg-surface border border-border rounded-2xl px-5 py-4 flex items-center justify-between">
            <p className="text-sm text-primary">{item}</p>
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-muted"
                 fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-surface border border-border rounded-2xl py-4 text-sm text-muted
                   font-medium transition-opacity active:opacity-60"
      >
        Sign out
      </button>

      <p className="mt-6 text-xs text-muted text-center opacity-50">
        Full config in Phase 8
      </p>
    </div>
  );
}
