import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

const isNative = !!(window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();

type Step = 'email' | 'code';

export default function LoginModal({ onDismiss }: { onDismiss?: () => void } = {}) {
  const { login } = useAuth();
  const { T } = useLanguage();
  const [step, setStep]       = useState<Step>('email');
  const [email, setEmail]     = useState('');
  const [code, setCode]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/send-code', { email });
      setStep('code');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? T.sendCodeFailed;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-code', { email, code });
      const meRes = await api.request({
        url: '/auth/me',
        headers: { Authorization: `Bearer ${res.data.token}` },
      });
      login(res.data.token, res.data.user, meRes.data.household);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? T.invalidCode;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30"
      onClick={onDismiss}
    >
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-2xl w-full max-w-sm p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 text-amber-700 font-bold text-xl mb-8 justify-center">
          <UtensilsCrossed size={24} />
          Dinnerly
        </div>

        <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">{T.signInHeading}</h1>

        <GoogleSignInButton />

        {!isNative && (
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">{T.or}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        )}
        {isNative && <div className="mb-5" />}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{T.emailLabel}</label>
              <input
                type="email" required autoFocus value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
            >
              {loading ? T.sendingCode : T.sendCode}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-sm text-gray-500 text-center">
              {T.codeSentTo} <span className="font-medium text-gray-700">{email}</span>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{T.codeLabel}</label>
              <input
                type="text" required autoFocus inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                value={code} onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <button
              type="submit" disabled={loading || code.length !== 6}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
            >
              {loading ? T.verifyingCode : T.verifyCode}
            </button>
            <button
              type="button" onClick={() => { setStep('email'); setCode(''); setError(''); }}
              className="w-full text-sm text-gray-500 hover:text-amber-700 py-1"
            >
              {T.changeEmail}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
