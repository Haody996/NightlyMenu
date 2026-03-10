import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Copy, Check, RefreshCw, LogOut, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { HouseholdWithMembers } from '../lib/types';

export default function HouseholdPage() {
  const { household, setHousehold, logout } = useAuth();
  const { T } = useLanguage();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [tab, setTab]   = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [householdData, setHouseholdData] = useState<HouseholdWithMembers | null>(null);

  useEffect(() => {
    if (household) {
      api.get('/households/me').then((r) => setHouseholdData(r.data as HouseholdWithMembers));
    }
  }, [household]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/households', { name });
      setHousehold(res.data);
      setHouseholdData(res.data as HouseholdWithMembers);
      qc.clear();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? T.failedCreate);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/households/join', { invite_code: code.trim() });
      setHousehold(res.data);
      setHouseholdData(res.data as HouseholdWithMembers);
      qc.clear();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? T.failedJoin);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    try {
      const res = await api.post('/households/regenerate-code');
      setHouseholdData((prev) => prev ? { ...prev, invite_code: res.data.invite_code } : prev);
    } catch { /* ignore */ }
  }

  async function handleLeave() {
    if (!confirm(T.leaveConfirm)) return;
    try {
      await api.post('/households/leave');
      setHousehold(null);
      setHouseholdData(null);
      qc.clear();
    } catch { /* ignore */ }
  }

  function handleCopy() {
    if (!householdData) return;
    navigator.clipboard.writeText(householdData.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // --- Has household: show management UI ---
  if (household) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Home size={20} className="text-amber-500" />
          <h1 className="text-2xl font-bold text-gray-800">{T.householdTitle}</h1>
        </div>

        {householdData ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-800 text-lg mb-1">{householdData.name}</h2>
              <p className="text-xs text-gray-400">{T.createdLabel} {new Date(householdData.created_at).toLocaleDateString()}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-700 mb-2">{T.inviteCodeTitle}</p>
              <p className="text-xs text-gray-500 mb-3">{T.inviteCodeDesc}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-amber-800 font-mono text-sm tracking-widest">
                  {householdData.invite_code}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-700 transition-colors"
                  title={T.copyCode}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <button
                  onClick={handleRegenerate}
                  className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-500 transition-colors"
                  title={T.generateNewCode}
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-gray-500" />
                <p className="text-sm font-medium text-gray-700">{T.membersLabel}</p>
                <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {householdData.members.length}
                </span>
              </div>
              <ul className="space-y-2">
                {householdData.members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-semibold shrink-0">
                      {m.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{m.name}</p>
                      <p className="text-xs text-gray-400">{m.email}</p>
                    </div>
                    <p className="ml-auto text-xs text-gray-400">
                      {T.joinedLabel} {new Date(m.joined_at).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
              >
                {T.goToMenu}
              </button>
              <button
                onClick={handleLeave}
                className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors"
              >
                <LogOut size={14} />
                {T.leave}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-10">{T.loading}</div>
        )}
      </div>
    );
  }

  // --- No household: create or join ---
  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Home size={20} className="text-amber-500" />
        <h1 className="text-2xl font-bold text-gray-800">{T.setupHouseholdTitle}</h1>
      </div>
      <p className="text-gray-500 text-sm mb-6">{T.setupHouseholdDesc}</p>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => { setTab('create'); setError(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'create' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
        >
          {T.createHousehold}
        </button>
        <button
          onClick={() => { setTab('join'); setError(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'join' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
        >
          {T.joinWithCode}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {tab === 'create' ? (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{T.householdNameLabel}</label>
            <input
              type="text" required value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={T.householdNamePlaceholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
          >
            {loading ? T.creating : T.createHousehold}
          </button>
        </form>
      ) : (
        <form onSubmit={handleJoin} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{T.inviteCodeLabel}</label>
            <input
              type="text" required value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={T.inviteCodeInputPlaceholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
          >
            {loading ? T.joining : T.joinHousehold}
          </button>
        </form>
      )}

      <button
        onClick={logout}
        className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 py-2"
      >
        {T.signOut}
      </button>
    </div>
  );
}
