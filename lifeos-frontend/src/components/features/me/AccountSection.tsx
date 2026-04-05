import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/api/auth';
import { inputCls } from './SectionCard';

export function AccountSection() {
  const { user, login, token } = useAuth();

  // Email change
  const [newEmail,       setNewEmail]       = useState('');
  const [emailPassword,  setEmailPassword]  = useState('');
  const [emailMsg,       setEmailMsg]       = useState<{ text: string; ok: boolean } | null>(null);
  const [emailPending,   setEmailPending]   = useState(false);

  // Password change
  const [currentPw,    setCurrentPw]    = useState('');
  const [newPw,        setNewPw]        = useState('');
  const [confirmPw,    setConfirmPw]    = useState('');
  const [pwMsg,        setPwMsg]        = useState<{ text: string; ok: boolean } | null>(null);
  const [pwPending,    setPwPending]    = useState(false);

  async function handleEmailChange() {
    if (!newEmail.trim() || !emailPassword) {
      setEmailMsg({ text: 'Email and current password are required', ok: false }); return;
    }
    setEmailPending(true); setEmailMsg(null);
    try {
      const updated = await authApi.changeEmail(newEmail.trim(), emailPassword);
      // Update the stored user object so the header shows the new email
      if (token) login(token, { ...user!, email: updated.email });
      setEmailMsg({ text: 'Email updated', ok: true });
      setNewEmail(''); setEmailPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Failed to update email';
      setEmailMsg({ text: msg, ok: false });
    } finally {
      setEmailPending(false);
    }
  }

  async function handlePasswordChange() {
    if (!currentPw || !newPw || !confirmPw) {
      setPwMsg({ text: 'All fields are required', ok: false }); return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ text: 'New passwords do not match', ok: false }); return;
    }
    if (newPw.length < 8) {
      setPwMsg({ text: 'Password must be at least 8 characters', ok: false }); return;
    }
    setPwPending(true); setPwMsg(null);
    try {
      await authApi.changePassword(currentPw, newPw);
      setPwMsg({ text: 'Password updated', ok: true });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Failed to update password';
      setPwMsg({ text: msg, ok: false });
    } finally {
      setPwPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-muted">Signed in as <span className="text-primary">{user?.email}</span></p>

      {/* Change email */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted uppercase tracking-wider">Change email</p>
        <input value={newEmail} onChange={e => setNewEmail(e.target.value)}
               type="email" placeholder="New email address" className={inputCls} />
        <input value={emailPassword} onChange={e => setEmailPassword(e.target.value)}
               type="password" placeholder="Current password" className={inputCls} />
        {emailMsg && (
          <p className={`text-xs ${emailMsg.ok ? 'text-accent-light' : 'text-red'}`}>{emailMsg.text}</p>
        )}
        <button onClick={handleEmailChange} disabled={emailPending}
                className="w-full bg-surface2 border border-border text-sm font-medium text-primary
                           rounded-xl py-2.5 transition-opacity disabled:opacity-50">
          {emailPending ? 'Saving…' : 'Update email'}
        </button>
      </div>

      <div className="border-t border-border/60" />

      {/* Change password */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted uppercase tracking-wider">Change password</p>
        <input value={currentPw} onChange={e => setCurrentPw(e.target.value)}
               type="password" placeholder="Current password" className={inputCls} />
        <input value={newPw} onChange={e => setNewPw(e.target.value)}
               type="password" placeholder="New password (min 8 chars)" className={inputCls} />
        <input value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
               type="password" placeholder="Confirm new password" className={inputCls} />
        {pwMsg && (
          <p className={`text-xs ${pwMsg.ok ? 'text-accent-light' : 'text-red'}`}>{pwMsg.text}</p>
        )}
        <button onClick={handlePasswordChange} disabled={pwPending}
                className="w-full bg-surface2 border border-border text-sm font-medium text-primary
                           rounded-xl py-2.5 transition-opacity disabled:opacity-50">
          {pwPending ? 'Saving…' : 'Update password'}
        </button>
      </div>
    </div>
  );
}
